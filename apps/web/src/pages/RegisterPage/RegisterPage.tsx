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
import { AuthDivider } from '@/features/auth/components/AuthDivider'
import { useRegister } from '@/features/auth/hooks'
import { registerSchema, type RegisterValues } from '@/features/auth/schemas'
import { useI18n } from '@/i18n'

export function RegisterPage() {
  const { t } = useI18n()


  const [googleAvailable, setGoogleAvailable] = useState(GOOGLE_SIGNIN_CONFIGURED)
  const signUp = useRegister()
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, dirtyFields },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),

    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      rePassword: '',
      dateOfBirth: '',
      gender: 'male',
    },
  })

  const fieldState = (name: keyof RegisterValues): FieldState => {
    if (errors[name]) return 'invalid'
    return dirtyFields[name] ? 'valid' : 'idle'
  }

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <>
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-brand-text hover:underline">
            {t('auth.login.submit')}
          </Link>
        </>
      }
    >
      {googleAvailable && (
        <>
          <GoogleButton
            text="signup_with"
            onUnavailable={() => setGoogleAvailable(false)}
          />
          <AuthDivider label={t('auth.register.dividerEmail')} />
        </>
      )}

      <form
        onSubmit={handleSubmit((values) => signUp.mutate(values))}
        className="space-y-4"
        noValidate
      >
        <Field
          label={t('auth.field.name')}
          error={errors.name?.message}
          state={fieldState('name')}
        >
          {({ id, describedBy, invalid, state }) => (
            <Input
              id={id}
              type="text"
              autoComplete="name"
              placeholder={t('auth.field.namePlaceholder')}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              state={state}
              {...register('name')}
            />
          )}
        </Field>

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
          hint={t('auth.field.passwordHint')}
          state={fieldState('password')}
        >
          {({ id, describedBy, invalid, state }) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              state={state}
              {...register('password')}
            />
          )}
        </Field>

        <Field
          label={t('auth.field.confirmPassword')}
          error={errors.rePassword?.message}
          state={fieldState('rePassword')}
        >
          {({ id, describedBy, invalid, state }) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              state={state}
              {...register('rePassword')}
            />
          )}
        </Field>

        <Field
          label={t('auth.field.dateOfBirth')}
          error={errors.dateOfBirth?.message}
          state={fieldState('dateOfBirth')}
        >
          {({ id, describedBy, invalid, state }) => (
            <Input
              id={id}
              type="date"
              autoComplete="bday"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              state={state}
              {...register('dateOfBirth')}
            />
          )}
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-content">{t('auth.field.gender')}</legend>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((value) => (
              <label
                key={value}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm capitalize transition-colors hover:border-line-strong has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand-text"
              >
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...register('gender')}
                />
                {value === 'male' ? t('auth.field.male') : t('auth.field.female')}
              </label>
            ))}
          </div>
          {errors.gender?.message && (
            <p role="alert" className="mt-1.5 text-xs text-danger">
              {errors.gender.message}
            </p>
          )}
        </fieldset>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={signUp.isPending}
          disabled={!isValid}
        >
          {t('auth.register.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
