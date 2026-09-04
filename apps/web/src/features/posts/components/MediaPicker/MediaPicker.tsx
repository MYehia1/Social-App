import { useEffect, useState } from 'react'
import { Film, ImagePlus, X } from 'lucide-react'
import { useI18n } from '@/i18n'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024

interface MediaPickerProps {
  image: File | null
  video: File | null
  onChange: (next: { image: File | null; video: File | null }) => void
  existingImage?: string | null
  existingVideo?: string | null
}


function usePreview(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return url
}

export function MediaPicker({
  image,
  video,
  onChange,
  existingImage,
  existingVideo,
}: MediaPickerProps) {
  const { t } = useI18n()
  const imagePreview = usePreview(image)
  const videoPreview = usePreview(video)
  const [error, setError] = useState<string | null>(null)

  const shownImage = imagePreview ?? existingImage ?? null
  const shownVideo = videoPreview ?? existingVideo ?? null

  function pick(kind: 'image' | 'video', file: File | null) {
    setError(null)
    if (!file) {
      onChange({ image: kind === 'image' ? null : image, video: kind === 'video' ? null : video })
      return
    }

    const limit = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
    if (file.size > limit) {
      setError(
        kind === 'image'
          ? t('post.media.imageTooLarge')
          : t('post.media.videoTooLarge'),
      )
      return
    }


    onChange({
      image: kind === 'image' ? file : null,
      video: kind === 'video' ? file : null,
    })
  }

  const clear = (kind: 'image' | 'video') =>
    onChange({
      image: kind === 'image' ? null : image,
      video: kind === 'video' ? null : video,
    })

  return (
    <div className="space-y-2">
      {shownImage && (
        <div className="relative overflow-hidden rounded-xl border border-line">
          <img
            src={shownImage}
            alt={t('post.media.previewAlt')}
            className="max-h-80 w-full object-cover"
          />
          {image && <RemoveButton onClick={() => clear('image')} label={t('post.media.removeImage')} />}
        </div>
      )}

      {shownVideo && (
        <div className="relative overflow-hidden rounded-xl border border-line">
          <video src={shownVideo} controls playsInline className="max-h-80 w-full bg-black" />
          {video && <RemoveButton onClick={() => clear('video')} label={t('post.media.removeVideo')} />}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        <PickButton
          icon={ImagePlus}
          label={shownImage ? t('post.media.changePhoto') : t('post.composer.photo')}
          accept="image/png,image/jpeg,image/webp,image/gif"
          onPick={(file) => pick('image', file)}
        />
        <PickButton
          icon={Film}
          label={shownVideo ? t('post.media.changeVideo') : t('post.composer.video')}
          accept="video/mp4,video/webm,video/quicktime"
          onPick={(file) => pick('video', file)}
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute end-2 top-2 grid size-8 cursor-pointer place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  )
}

function PickButton({
  icon: Icon,
  label,
  accept,
  onPick,
}: {
  icon: typeof ImagePlus
  label: string
  accept: string
  onPick: (file: File | null) => void
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-content">
      <Icon className="size-[18px]" aria-hidden="true" />
      {label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          onPick(event.target.files?.[0] ?? null)

          event.target.value = ''
        }}
      />
    </label>
  )
}
