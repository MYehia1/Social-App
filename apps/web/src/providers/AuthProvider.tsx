import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api/auth'
import { restoreSession } from '@/lib/api/client'
import { queryKeys } from '@/lib/queryKeys'
import { session } from '@/lib/session'
import { AuthContext } from './auth-context'
import type { User } from '@/types/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => session.get())

  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    const unsubscribe = session.subscribe(setToken)
    void restoreSession().finally(() => setRestoring(false))
    return unsubscribe
  }, [])

  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: () => authApi.me(),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const signIn = useCallback(
    (accessToken: string, nextUser?: User) => {
      session.set(accessToken)

      if (nextUser) queryClient.setQueryData(queryKeys.currentUser(), nextUser)
    },
    [queryClient],
  )

  const signOut = useCallback(() => {

    session.clear()
    queryClient.clear()
    void authApi.logout().catch(() => undefined)
  }, [queryClient])

  const value = useMemo(
    () => ({
      token,
      user: user ?? null,
      isAuthenticated: Boolean(token),
      isLoading: restoring || (Boolean(token) && isLoading),
      signIn,
      signOut,
    }),
    [token, user, restoring, isLoading, signIn, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
