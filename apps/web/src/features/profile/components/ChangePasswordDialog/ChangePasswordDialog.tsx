import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Field, Modal, PasswordInput } from '@/components/ui'
import { changePasswordSchema, type ChangePasswordValues } from '@/features/auth/schemas'
import { useChangePassword } from '../../hooks'

export function ChangePasswordDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const changePassword = useChangePassword()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: { password: '', newPassword: '' },
  })

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  return (
    <Modal open={open} onClose={onClose} title="Change password">
      <form
        id="change-password"
        onSubmit={handleSubmit((values) =>
          changePassword.mutate(values, {
            onSuccess: () => {
              reset()
              onClose()
            },
          }),
        )}
        className="space-y-4"
      >
        <Field label="Current password" error={errors.password?.message}>
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              autoComplete="current-password"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              {...register('password')}
            />
          )}
        </Field>

        <Field label="New password" error={errors.newPassword?.message}>
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              {...register('newPassword')}
            />
          )}
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={changePassword.isPending} disabled={!isValid}>
            Update password
          </Button>
        </div>
      </form>
    </Modal>
  )
}
