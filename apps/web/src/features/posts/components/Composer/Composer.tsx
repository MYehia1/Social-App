import { useState } from 'react'
import { Avatar, Button, Card } from '@/components/ui'
import { MentionInput } from '@/components/MentionInput'
import { useAuth } from '@/providers/auth-context'
import { useCreatePost } from '../../hooks'
import { MediaPicker } from '../MediaPicker'
import { useI18n } from '@/i18n'

const MAX_LENGTH = 500

export function Composer() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [media, setMedia] = useState<{ image: File | null; video: File | null }>({
    image: null,
    video: null,
  })
  const createPost = useCreatePost()

  const trimmed = body.trim()

  const hasMedia = Boolean(media.image || media.video)
  const canSubmit = (trimmed.length > 0 || hasMedia) && trimmed.length <= MAX_LENGTH
  const remaining = MAX_LENGTH - trimmed.length

  function submit() {
    if (!canSubmit || createPost.isPending) return

    createPost.mutate(
      { body: trimmed, image: media.image, video: media.video },
      {
        onSuccess: () => {
          setBody('')
          setMedia({ image: null, video: null })
        },
      },
    )
  }

  return (
    <Card className="p-4 transition-colors has-[:focus-visible]:border-focus">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className="space-y-3"
      >
        <div className="flex gap-3">
          <Avatar src={user?.photo} name={user?.name ?? '?'} />
          {}
          <MentionInput
            value={body}
            onChange={setBody}
            rows={3}
            maxLength={MAX_LENGTH}
            placeholder={t('post.composer.placeholder')}
            ariaLabel={t('post.composer.label')}
            className="border-0 bg-transparent px-0 py-1.5 text-[0.9375rem] shadow-none hover:border-0 focus:border-0 focus-visible:outline-none focus-visible:shadow-none"



            onSubmit={submit}
          />
        </div>

        <div className="ps-13">
          <MediaPicker
            image={media.image}
            video={media.video}
            onChange={setMedia}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-line pt-3">
          {trimmed.length > 0 && (
            <span
              className={remaining < 50 ? 'text-xs text-danger' : 'text-xs text-subtle'}
              aria-live="polite"
            >
              {remaining}
            </span>
          )}
          <Button type="submit" disabled={!canSubmit} loading={createPost.isPending}>
            {t('post.composer.submit')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
