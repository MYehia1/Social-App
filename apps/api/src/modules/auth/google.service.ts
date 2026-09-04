import { OAuth2Client } from 'google-auth-library'
import { ProviderEnum } from '../../common/enums'
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '../../common/exceptions'
import { generateUsername } from '../../common/username'
import { env, googleAuthEnabled } from '../../config/config'
import { UserRepository } from '../../DB/repository'
import type { UserDocument } from '../../DB/models'

let client: OAuth2Client | null = null

function getClient(): OAuth2Client {
  if (!googleAuthEnabled) {
    throw new ServiceUnavailableException('Google sign-in is not configured')
  }
  client ??= new OAuth2Client(env.GOOGLE_CLIENT_ID)
  return client
}

interface GoogleProfile {
  email: string
  name: string
  picture: string | undefined
}

/**
 * Verifies the ID token Google Identity Services handed the browser.
 *
 * `verifyIdToken` checks the signature against Google's rotating public keys,
 * the expiry, and — critically — that the token was minted for *our* client id.
 * Without that audience check, a token issued to any other site would be
 * accepted here.
 */
async function verifyToken(idToken: string): Promise<GoogleProfile> {
  let payload
  try {
    const ticket = await getClient().verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID as string,
    })
    payload = ticket.getPayload()
  } catch (error) {
    throw new UnauthorizedException('Could not verify that Google account. Try again, or sign in with your email and password.', error)
  }

  if (!payload?.email) {
    throw new UnauthorizedException('That Google account has no email address. Use a different account, or sign up with an email and password.')
  }

  // Google sets this false for some managed domains; without it we would be
  // trusting an address the user never proved they own.
  if (!payload.email_verified) {
    throw new UnauthorizedException('That Google email address is not verified. Confirm it with Google first, then try again.')
  }

  return {
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email.split('@')[0] ?? 'New user',
    picture: payload.picture,
  }
}

class GoogleAuthService {
  private readonly userRepository = new UserRepository()

  /**
   * Signs in, links, or creates an account from a Google ID token.
   *
   * No OTP is issued on this path: Google has already verified the address, so
   * asking the user to confirm it again would be theatre.
   */
  async authenticate(idToken: string): Promise<UserDocument> {
    const profile = await verifyToken(idToken)
    const existing = await this.userRepository.findByEmail(profile.email)

    if (existing) {
      // A password account signing in with the same verified address: link the
      // two rather than erroring, and confirm it while we are here.
      if (existing.provider !== ProviderEnum.GOOGLE) {
        existing.provider = ProviderEnum.GOOGLE
      }
      existing.confirmedAt ??= new Date()
      // Only fill the avatar if they have not chosen one of their own.
      if (!existing.photo && profile.picture) existing.photo = profile.picture
      await existing.save()
      return existing
    }

    return this.userRepository.create({
      name: profile.name,
      username: await generateUsername(profile.name),
      email: profile.email,
      provider: ProviderEnum.GOOGLE,
      confirmedAt: new Date(),
      ...(profile.picture ? { photo: profile.picture } : {}),
    })
  }
}

export const googleAuthService = new GoogleAuthService()
