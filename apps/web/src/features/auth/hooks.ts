import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api/auth'
import { ApiError, } from '@/lib/api/client'
import { useAuth } from '@/providers/auth-context'
import type { LoginValues, RegisterValues } from './schemas'
import { toLocalisedMessage, useI18n } from '@/i18n'


function emailFromDetails(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null
  const details = error.details
  if (details && typeof details === 'object' && 'email' in details) {
    const email = (details as { email?: unknown }).email
    return typeof email === 'string' ? email : null
  }
  return null
}

export function useLogin() {
  const { t } = useI18n()
  const { signIn } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (values: LoginValues) => authApi.login(values),
    onSuccess: ({ accessToken, user }) => {


      signIn(accessToken, user)
      toast.success(t('toast.welcomeBack', { name: user.name.split(' ')[0] ?? '' }))
      void navigate('/', { replace: true })
    },
    onError: (error) => {



      const code =
        error instanceof ApiError && typeof error.details === 'object' && error.details
          ? (error.details as { code?: string }).code
          : undefined

      if (code === 'USE_GOOGLE_SIGNIN') {
        toast.error(toLocalisedMessage(t, error))
        return
      }

      const email = emailFromDetails(error)
      if (email) {
        toast(t('toast.verifyFirst'))
        void navigate(`/verify?email=${encodeURIComponent(email)}`)
        return
      }
      toast.error(toLocalisedMessage(t, error))
    },
  })
}

export function useRegister() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (values: RegisterValues) => authApi.register(values),
    onSuccess: ({ email, expiresAt }) => {
      toast.success(t('toast.codeSent', { email }))

      void navigate(
        `/verify?email=${encodeURIComponent(email)}&expires=${encodeURIComponent(expiresAt)}`,
        { replace: true },
      )
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

export function useVerifyCode() {
  const { t } = useI18n()
  const { signIn } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      authApi.verifyCode(email, code),
    onSuccess: ({ accessToken, user }) => {

      signIn(accessToken, user)
      toast.success(t('toast.verified'))
      void navigate('/', { replace: true })
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

export function useResendCode() {
  const { t } = useI18n()
  return useMutation({
    mutationFn: (email: string) => authApi.resendCode(email),
    onSuccess: () => toast.success(t('toast.newCodeSent')),
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}


export function useGoogleAuth() {
  const { t } = useI18n()
  const { signIn } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (idToken: string) => authApi.google(idToken),
    onSuccess: ({ accessToken, user }) => {
      signIn(accessToken, user)
      toast.success(t('toast.welcome', { name: user.name.split(' ')[0] ?? '' }))
      void navigate('/', { replace: true })
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}
