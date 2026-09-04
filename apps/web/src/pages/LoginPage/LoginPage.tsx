import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Button, Field, Input, PasswordInput, type FieldState } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import {
  GoogleButton,
  GOOGLE_SIGNIN_CONFIGURED,
} from '@/features/auth/components/GoogleButton'
import {
  DemoLoginButton,
  DEMO_LOGIN_CONFIGURED,
} from '@/features/auth/components/DemoLoginButton'
import { AuthDivider } from '@/features/auth/components/AuthDivider'
import { useLogin } from '@/features/auth/hooks'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { useI18n } from '@/i18n'

export function LoginPage() {
  const { t } = useI18n()



  const [googleAvailable, setGoogleAvailable] = useState(GOOGLE_SIGNIN_CONFIGURED)
  const showOneClick = googleAvailable || DEMO_LOGIN_CONFIGURED
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, dirtyFields },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),

    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  })

  const fieldState = (name: keyof LoginValues): FieldState => {
    if (errors[name]) return 'invalid'
    return dirtyFields[name] ? 'valid' : 'idle'
  }

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          {t('auth.login.newHere')}{' '}
          <Link to="/register" className="font-medium text-brand-text hover:underline">
            {t('auth.login.createAccount')}
          </Link>
        </>
      }
    >
      {}
      {showOneClick && (
        <>
          <div className="space-y-3">
            <GoogleButton
              text="signin_with"
              onUnavailable={() => setGoogleAvailable(false)}
            />
            <DemoLoginButton />
          </div>

          <AuthDivider label={t('auth.login.dividerEmail')} />
        </>
      )}

      <form
        onSubmit={handleSubmit((values) => login.mutate(values))}
        className="space-y-4"
        noValidate
      >
        <Field
          label={t('auth.field.email')}
          error={errors.email?.message}
          state={fieldState('email')}
        >
          {({ id, describedBy, invalid, state }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              placeholder={t('auth.field.emailPlaceholder')}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              state={state}
              {...register('email')}
            />
          )}
        </Field>

        <Field
          label={t('auth.field.password')}
          error={errors.password?.message}
          state={fieldState('password')}
        >
          {({ id, describedBy, invalid, state }) => (
            <PasswordInput
              id={id}
              autoComplete="current-password"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              state={state}
              {...register('password')}
            />
          )}
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={login.isPending}
          disabled={!isValid}
        >
          {t('auth.login.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
