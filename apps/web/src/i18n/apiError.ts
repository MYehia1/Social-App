import { ApiError } from '@/lib/api/client'
import type { TranslationKey } from './locales/en'
import type { Translate } from './i18n-context'


const BY_MESSAGE: Record<string, TranslationKey> = {
  'Incorrect email or password': 'apiError.badCredentials',
  'Sign in to continue': 'apiError.signInToContinue',
  'Your session has expired. Sign in again.': 'apiError.sessionExpired',
  'An account with that email already exists': 'apiError.emailTaken',
  'That username is already taken': 'apiError.usernameTaken',
  'Your current password is incorrect': 'apiError.wrongPassword',
  'That code is not correct': 'apiError.codeIncorrect',
  'That code has expired. Request a new one.': 'apiError.codeExpired',
  'Use "Continue with Google" to sign in to this account': 'apiError.useGoogle',
  'You do not have access to this': 'apiError.noAccess',
  'Account not found': 'apiError.notFound',
  'Check the highlighted fields and try again': 'apiError.validation',
}


export function toLocalisedMessage(t: Translate, error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return t('apiError.network')

    const key = BY_MESSAGE[error.message]
    if (key) return t(key)
    return error.message
  }

  if (error instanceof Error && error.message) return error.message
  return t('apiError.generic')
}
