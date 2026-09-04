import { http } from './client'
import type {
  ChangePasswordPayload,
  Envelope,
  LoginPayload,
  RegisterPayload,
  User,
} from '@/types/api'

interface AuthPayload {
  user: User
  accessToken: string
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthPayload> {
    const { data } = await http.post<Envelope<AuthPayload>>('/auth/login', payload)
    return data.data
  },

  async register(
    payload: RegisterPayload,
  ): Promise<{ email: string; expiresAt: string; requiresVerification: boolean }> {
    const { data } = await http.post<
      Envelope<{ email: string; expiresAt: string; requiresVerification: boolean }>
    >('/auth/signup', payload)
    return data.data
  },

  async google(idToken: string): Promise<AuthPayload> {
    const { data } = await http.post<Envelope<AuthPayload>>('/auth/google', { idToken })
    return data.data
  },

  async verifyCode(email: string, code: string): Promise<AuthPayload> {
    const { data } = await http.post<Envelope<AuthPayload>>('/auth/verify', {
      email,
      code,
    })
    return data.data
  },

  async resendCode(email: string): Promise<{ expiresAt: string | null }> {
    const { data } = await http.post<Envelope<{ expiresAt: string | null }>>(
      '/auth/resend-code',
      { email },
    )
    return data.data
  },

  async me(): Promise<User> {
    const { data } = await http.get<Envelope<{ user: User }>>('/auth/me')
    return data.data.user
  },

  async changePassword(payload: ChangePasswordPayload): Promise<AuthPayload> {
    const { data } = await http.patch<Envelope<AuthPayload>>('/auth/password', payload)
    return data.data
  },

  async logout(): Promise<void> {
    await http.post('/auth/logout')
  },
}
