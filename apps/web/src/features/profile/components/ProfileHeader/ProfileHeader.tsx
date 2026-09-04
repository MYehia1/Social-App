import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Camera, ImagePlus, KeyRound, Pencil } from 'lucide-react'
import { Avatar, Button, Card } from '@/components/ui'
import { ageFrom } from '@/lib/format'
import { useI18n } from '@/i18n'
import { CoverCarousel } from '../CoverCarousel'
import { useUploadCover, useUploadPhoto } from '../../hooks'
import { ChangePasswordDialog } from '../ChangePasswordDialog'
import { EditProfileDialog } from '../EditProfileDialog'
import type { User } from '@/types/api'

interface ProfileHeaderProps {
  user: User
  postCount: number

  editable?: boolean
  action?: ReactNode
}


function PhotoButton({
  onPick,
  label,
  className,
  children,
  disabled,
}: {
  onPick: (file: File) => void
  label: string
  className: string
  children: ReactNode
  disabled?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        aria-label={label}
        disabled={disabled}
        className={className}
      >
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onPick(file)
          event.target.value = ''
        }}
      />
    </>
  )
}

export function ProfileHeader({
  user,
  postCount,
  editable = false,
  action,
}: ProfileHeaderProps) {
  const { t } = useI18n()
  const [changingPassword, setChangingPassword] = useState(false)
  const [editing, setEditing] = useState(false)
  const uploadPhoto = useUploadPhoto()
  const uploadCover = useUploadCover()

  const age = ageFrom(user.dateOfBirth)
  const birthday = user.dateOfBirth
    ? new Date(user.dateOfBirth).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <Card className="overflow-hidden">
      <div className="relative h-36 sm:h-48">
        <CoverCarousel covers={user.coverPhotos} />

        {editable && (
          <PhotoButton
            onPick={(file) => uploadCover.mutate(file)}
            label={t('profile.changeCover')}
            disabled={uploadCover.isPending}
            className="absolute end-3 top-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/70 disabled:opacity-60"
          >
            <ImagePlus className="size-4" aria-hidden="true" />
            {t('profile.cover')}
          </PhotoButton>
        )}
      </div>

      <div className="px-5 pb-5">
        <div className="-mt-12 flex items-end justify-between gap-4">
          <div className="relative">
            <Avatar
              src={user.photo}
              name={user.name}
              size="xl"
              className="ring-4 ring-surface"
            />
            {editable && (
              <PhotoButton
                onPick={(file) => uploadPhoto.mutate(file)}
                label={t('profile.changePhoto')}
                disabled={uploadPhoto.isPending}
                className="absolute bottom-0 end-0 grid size-8 cursor-pointer place-items-center rounded-full border border-line bg-surface text-muted shadow-sm transition-colors hover:text-content disabled:opacity-60"
              >
                <Camera className="size-4" aria-hidden="true" />
              </PhotoButton>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {action}
            {editable && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  {t('profile.editProfile')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setChangingPassword(true)}
                >
                  <KeyRound className="size-4" aria-hidden="true" />
                  {t('profile.password')}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-3">
          <h1 dir="auto" className="text-xl font-semibold tracking-tight text-content">
            {user.name}
          </h1>
          <p className="text-sm text-subtle">
            <bdi>@{user.username}</bdi>
          </p>
          {user.bio && (
            <p dir="auto" className="mt-2 text-sm text-muted">
              {user.bio}
            </p>
          )}
        </div>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex gap-1.5">
            <dt className="font-semibold text-content">{postCount}</dt>
            <dd className="text-muted">
              {postCount === 1 ? t('profile.postsOne') : t('profile.posts')}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="font-semibold text-content">{user.friendCount}</dt>
            <dd className="text-muted">
              {editable ? (
                <Link to="/friends" className="hover:underline">
                  {user.friendCount === 1 ? t('profile.friendsOne') : t('profile.friends')}
                </Link>
              ) : user.friendCount === 1 ? (
                t('profile.friendsOne')
              ) : (
                t('profile.friends')
              )}
            </dd>
          </div>
          {age !== null && (
            <div className="flex gap-1.5">
              <dt className="font-semibold text-content">{age}</dt>
              <dd className="text-muted">
                {}
                <span title={birthday ?? undefined}>
                  {age === 1 ? t('profile.yearOld') : t('profile.yearsOld')}
                </span>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {editable && (
        <>
          <ChangePasswordDialog
            open={changingPassword}
            onClose={() => setChangingPassword(false)}
          />
          {editing && (
            <EditProfileDialog user={user} open onClose={() => setEditing(false)} />
          )}
        </>
      )}
    </Card>
  )
}
