import { cn } from '@/lib/cn'


type Tone = 'brand' | 'on-dark'


export function LogoMark({
  className,
  tone = 'brand',
}: {
  className?: string
  tone?: Tone
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('size-7', className)}
    >
      <circle cx="8.5" cy="16" r="3.6" className="fill-accent" />
      <g
        className={tone === 'on-dark' ? 'stroke-white' : 'stroke-brand'}
        strokeWidth="2.25"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M12.7 10.6a7 7 0 0 1 0 10.8" opacity="0.9" />
        <path d="M16.9 7.2a11.5 11.5 0 0 1 0 17.6" opacity="0.62" />
        <path d="M21.1 3.8a16 16 0 0 1 0 24.4" opacity="0.38" />
      </g>
    </svg>
  )
}

export function Logo({
  className,
  tone = 'brand',
  markClassName,
}: {
  className?: string
  tone?: Tone
  markClassName?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark tone={tone} className={markClassName} />
      <span
        className={cn(
          'text-lg font-semibold tracking-tight',
          tone === 'on-dark' ? 'text-white' : 'text-content',
        )}
      >
        Echoo
      </span>
    </span>
  )
}
