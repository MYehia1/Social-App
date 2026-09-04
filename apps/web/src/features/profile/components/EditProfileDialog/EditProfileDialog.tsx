import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Field, Input, Modal, Textarea } from '@/components/ui'
import { useUpdateProfile } from '../../hooks'
import type { User } from '@/types/api'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(50, 'Keep it under 50 characters'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'At least 3 characters')
    .max(20, 'At most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Use only letters, numbers and underscores'),
  bio: z.string().trim().max(160, 'Keep it under 160 characters'),
})

type Values = z.infer<typeof schema>

export function EditProfileDialog({
  user,
  open,
  onClose,
}: {
  user: User
  open: boolean
  onClose: () => void
}) {
  const updateProfile = useUpdateProfile()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: user.name,
      username: user.username,
      bio: user.bio ?? '',
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <form
        onSubmit={handleSubmit((values) =>
          updateProfile.mutate(values, {
            onSuccess: onClose,
            onError: (error) => {

              if (error instanceof Error && /username/i.test(error.message)) {
                setError('username', { message: error.message })
              }
            },
          }),
        )}
        className="space-y-4"
      >
        <Field label="Name" error={errors.name?.message}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              autoComplete="name"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              {...register('name')}
            />
          )}
        </Field>

        <Field
          label="Username"
          error={errors.username?.message}
          hint="People can mention you with @username."
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              autoComplete="username"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              {...register('username')}
            />
          )}
        </Field>

        <Field label="Bio" error={errors.bio?.message}>
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={3}
              maxLength={160}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              {...register('bio')}
            />
          )}
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={updateProfile.isPending} disabled={!isValid}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
