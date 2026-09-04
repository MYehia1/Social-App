import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useLogin } from '../../hooks'

const email = import.meta.env.VITE_DEMO_EMAIL
const password = import.meta.env.VITE_DEMO_PASSWORD


export const DEMO_LOGIN_CONFIGURED = Boolean(email && password)


export function DemoLoginButton() {
  const { t } = useI18n()
  const login = useLogin()

  if (!email || !password) return null

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full"
      loading={login.isPending}
      onClick={() => login.mutate({ email, password })}
    >
      <Sparkles className="size-4" aria-hidden="true" />
      {t('auth.demo.explore')}
    </Button>
  )
}
