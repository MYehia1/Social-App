import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'

interface CoverCarouselProps {

  covers?: string[] | undefined
}


export function CoverCarousel({ covers = [] }: CoverCarouselProps) {
  const { t, dir } = useI18n()
  const [index, setIndex] = useState(0)
  const newest = covers[0]



  useEffect(() => setIndex(0), [newest])

  if (covers.length === 0) {
    return (
      <div className="size-full bg-gradient-to-br from-panel-from via-panel-via to-panel-to" />
    )
  }

  const go = (delta: number) =>
    setIndex((current) => (current + delta + covers.length) % covers.length)


  const previousIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
  const nextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight
  const PreviousIcon = previousIcon
  const NextIcon = nextIcon

  const control =
    'absolute top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center ' +
    'rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/65'

  return (
    <div className="group/cover relative size-full">
      {covers.map((url, position) => (
        <img
          key={url}
          src={url}
          alt=""


          loading={position === 0 ? 'eager' : 'lazy'}
          className={cn(
            'absolute inset-0 size-full object-cover transition-opacity duration-300',
            position === index ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden={position === index ? undefined : true}
        />
      ))}

      {covers.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t('profile.coverPrevious')}
            className={cn(control, 'start-2')}
          >
            <PreviousIcon className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t('profile.coverNext')}
            className={cn(control, 'end-2')}
          >
            <NextIcon className="size-4" aria-hidden="true" />
          </button>

          {}
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {covers.map((url, position) => (
              <button
                key={url}
                type="button"
                onClick={() => setIndex(position)}
                aria-label={t('profile.coverGoTo', { index: position + 1 })}
                aria-current={position === index}
                className={cn(


                  'grid size-6 cursor-pointer place-items-center rounded-full',
                )}
              >
                <span
                  className={cn(
                    'block size-1.5 rounded-full ring-1 ring-black/30 transition-all',
                    position === index ? 'w-4 bg-white' : 'bg-white/60',
                  )}
                />
              </button>
            ))}
          </div>

          <span className="sr-only" aria-live="polite">
            {t('profile.coverPosition', { index: index + 1, total: covers.length })}
          </span>
        </>
      )}
    </div>
  )
}
