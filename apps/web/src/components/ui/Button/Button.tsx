import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from '../Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {








  primary:
    'border border-accent-border bg-accent text-on-accent hover:bg-accent-hover shadow-sm ' +
    'focus-visible:outline-[var(--on-accent)] focus-visible:outline-offset-0',
  secondary:
    'bg-surface text-content border border-line hover:bg-surface-hover',
  ghost: 'text-muted hover:bg-surface-hover hover:text-content',
  danger: 'bg-danger text-white hover:opacity-90 shadow-sm',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[0.9375rem] gap-2',
  icon: 'size-9 p-0',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, disabled, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}

      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-lg font-medium',
        'transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
