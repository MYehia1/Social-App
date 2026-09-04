import { useEffect, useState } from 'react'
import { Button, Modal } from '@/components/ui'
import { MentionInput } from '@/components/MentionInput'
import { useUpdatePost } from '../../hooks'
import { MediaPicker } from '../MediaPicker'
import type { Post } from '@/types/api'
import { useI18n } from '@/i18n'

interface EditPostDialogProps {
  post: Post
  open: boolean
  onClose: () => void
}

export function EditPostDialog({ post, open, onClose }: EditPostDialogProps) {
  const { t } = useI18n()
  const [body, setBody] = useState(post.body)
  const [media, setMedia] = useState<{ image: File | null; video: File | null }>({
    image: null,
    video: null,
  })
  const updatePost = useUpdatePost(post.id)


  useEffect(() => {
    if (open) {
      setBody(post.body)
      setMedia({ image: null, video: null })
    }
  }, [open, post.body])

  const trimmed = body.trim()
  const hasExisting = Boolean(post.image || post.video)
  const hasNew = Boolean(media.image || media.video)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('post.edit.title')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={updatePost.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              updatePost.mutate(
                { body: trimmed, image: media.image, video: media.video },
                { onSuccess: onClose },
              )
            }
            loading={updatePost.isPending}
            disabled={trimmed.length === 0 && !hasNew && !hasExisting}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <MentionInput
          value={body}
          onChange={setBody}
          rows={4}
          maxLength={500}


          ariaLabel={t('post.edit.label')}
        />
        <MediaPicker
          image={media.image}
          video={media.video}
          onChange={setMedia}
          existingImage={post.image}
          existingVideo={post.video}
        />
      </div>
    </Modal>
  )
}
