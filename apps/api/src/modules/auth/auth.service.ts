import { randomUUID } from 'node:crypto'
import { ProviderEnum } from '../../common/enums'
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '../../common/exceptions'
import { passwordChangedEmail, sendMail, verificationEmail } from '../../common/mail'
import {
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  generateOtp,
  hashOtp,
  otpMatches,
} from '../../common/otp'
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken,
} from '../../common/security'
import { generateUsername } from '../../common/username'
import { UserRepository } from '../../DB/repository'
import type { UserDocument } from '../../DB/models'
import type { AuthResult, ChangePasswordDto, LoginDto, SignupDto } from './auth.dto'
import { toPublicUser } from './auth.mapper'

class AuthenticationService {
  private readonly userRepository = new UserRepository()

  /** Public so the Google route produces an identical session shape. */
  issueTokens(user: UserDocument): AuthResult {
    return {
      user: toPublicUser(user),
      accessToken: signAccessToken(user._id.toString(), user.role),
      refreshToken: signRefreshToken(user._id.toString(), randomUUID()),
    }
  }

  /** Stamps a fresh code on the account and emails it. */
  private async issueOtp(user: UserDocument): Promise<string> {
    const code = generateOtp()
    const expiresAt = new Date(Date.now() + OTP_TTL_MS)

    user.otpHash = hashOtp(code)
    user.otpExpiresAt = expiresAt
    user.otpAttempts = 0
    await user.save()

    // A mail failure must not leave a user stranded with no way to retry, so
    // it is logged and the caller still gets a success — they can resend.
    try {
      await sendMail({ to: user.email, ...verificationEmail(code, user.name) })
    } catch (error) {
      console.error('Failed to send verification email:', error)
    }

    return expiresAt.toISOString()
  }

  /**
   * Creates the account but does not sign anyone in — the code emailed here
   * has to be confirmed first.
   */
  async signup(data: SignupDto): Promise<{ email: string; expiresAt: string }> {
    const existing = await this.userRepository.findByEmail(data.email)

    if (existing) {
      // An unverified account that was never completed can be re-claimed,
      // otherwise a typo would permanently burn the address.
      if (!existing.confirmedAt) {
        existing.name = data.name
        existing.password = await hashPassword(data.password)
        existing.dateOfBirth = data.dateOfBirth
        existing.gender = data.gender
        await existing.save()
        const expiresAt = await this.issueOtp(existing)
        return { email: existing.email, expiresAt }
      }
      throw new ConflictException('An account with that email already exists')
    }

    const user = await this.userRepository.create({
      name: data.name,
      // Signup does not ask for a handle; one is derived and stays editable.
      username: await generateUsername(data.name),
      email: data.email,
      // Hashed before it ever reaches the database.
      password: await hashPassword(data.password),
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
    })

    const expiresAt = await this.issueOtp(user)
    return { email: user.email, expiresAt }
  }

  /** Exchanges a valid code for a session. */
  async verifyOtp(email: string, code: string): Promise<AuthResult> {
    const user = await this.userRepository.findOne(
      { email: email.toLowerCase() },
      '+otpHash +otpExpiresAt +otpAttempts',
    )

    if (!user) throw new NotFoundException('No account found for that email')
    if (user.confirmedAt) throw new ConflictException('This account is already verified')
    if (!user.otpHash || !user.otpExpiresAt) {
      throw new UnauthorizedException('That code is no longer valid. Request a new one.')
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('That code has expired. Request a new one.')
    }

    // Burn the code after too many wrong guesses so it cannot be brute-forced
    // inside its short validity window.
    if ((user.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException(
        `Too many incorrect attempts (${OTP_MAX_ATTEMPTS}). Request a new code.`,
      )
    }

    if (!otpMatches(code, user.otpHash)) {
      user.otpAttempts = (user.otpAttempts ?? 0) + 1
      await user.save()
      throw new UnauthorizedException('That code is not correct')
    }

    user.confirmedAt = new Date()
    user.otpHash = undefined
    user.otpExpiresAt = undefined
    user.otpAttempts = 0
    await user.save()

    return this.issueTokens(user)
  }

  async resendOtp(email: string): Promise<{ expiresAt: string | null }> {
    const user = await this.userRepository.findOne(
      { email: email.toLowerCase() },
      '+otpHash +otpExpiresAt +otpAttempts',
    )

    // Silent on unknown or already-verified addresses, so this endpoint cannot
    // be used to discover which emails are registered.
    if (!user || user.confirmedAt) return { expiresAt: null }

    return { expiresAt: await this.issueOtp(user) }
  }

  async login(data: LoginDto): Promise<AuthResult> {
    const user = await this.userRepository.findByEmailWithPassword(data.email)

    // One message for both branches, so the endpoint cannot be used to
    // discover which email addresses are registered.
    const invalid = new UnauthorizedException('Incorrect email or password')
    if (!user) throw invalid

    // An account created through Google has no password to compare against.
    // Pointing them at the right button beats a misleading "wrong password".
    if (!user.password) {
      throw new ForbiddenException('Use "Continue with Google" to sign in to this account', {
        code: 'USE_GOOGLE_SIGNIN',
        email: user.email,
      })
    }

    if (!(await verifyPassword(data.password, user.password))) throw invalid

    if (!user.confirmedAt) {
      // A distinct code so the client can route to the verification screen
      // rather than showing a dead end.
      throw new ForbiddenException('Verify your email to finish signing in', {
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      })
    }

    return this.issueTokens(user)
  }

  async refresh(token: string | undefined): Promise<{ accessToken: string }> {
    if (!token) throw new UnauthorizedException('Your session has expired. Sign in again.')

    const payload = verifyRefreshToken(token)
    const user = await this.userRepository.findById(payload.sub)
    if (!user) throw new UnauthorizedException('Account not found')

    // A password change retires every token issued before it.
    if (user.credentialsChangedAt) {
      const changedAt = Math.floor(user.credentialsChangedAt.getTime() / 1000)
      if (payload.iat < changedAt) {
        throw new UnauthorizedException('Your session has expired. Sign in again.')
      }
    }

    return { accessToken: signAccessToken(user._id.toString(), user.role) }
  }

  async changePassword(userId: string, data: ChangePasswordDto): Promise<AuthResult> {
    const user = await this.userRepository.findOne({ _id: userId }, '+password')
    if (!user) throw new NotFoundException('Account not found')

    // Nothing to change, and nothing to verify against.
    if (!user.password) {
      throw new ConflictException(
        'This account signs in with Google and has no password to change',
      )
    }

    if (!(await verifyPassword(data.password, user.password))) {
      throw new UnauthorizedException('Your current password is incorrect')
    }

    user.password = await hashPassword(data.newPassword)
    // A password now exists, so this is a password account again.
    user.provider = ProviderEnum.SYSTEM
    // Invalidates every token issued before now, on every device.
    const changedAt = new Date()
    user.credentialsChangedAt = changedAt
    await user.save()

    // Told after the fact, never as an approval step: if this change was not
    // theirs, the notice is how they find out while they can still act.
    //
    // Deliberately not awaited. The password is already persisted, so the
    // caller has nothing to gain from waiting on SMTP and everything to lose:
    // an unreachable host would hold the response open for the transport's
    // timeout while the user stares at a spinner over work that already
    // succeeded. Failure is logged, exactly as the signup code's is.
    void sendMail({ to: user.email, ...passwordChangedEmail(user.name, changedAt) }).catch(
      (error: unknown) => console.error('Failed to send password-change notice:', error),
    )

    return this.issueTokens(user)
  }
}

export const authService = new AuthenticationService()
