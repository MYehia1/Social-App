import { createContext, useContext } from 'react'
import type { User } from '@/types/api'

export interface AuthContextValue {
  token: string | null
  user: User | null
  isAuthenticated: boolean

  isLoading: boolean
  signIn: (accessToken: string, user?: User) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
