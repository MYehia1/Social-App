import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

export type FieldState = 'idle' | 'valid' | 'invalid'

const base =
  'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-content ' +
  'placeholder:text-subtle transition-colors ' +
  'focus-visible:outline-none focus-visible:shadow-none ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

const states: Record<FieldState, string> = {
  idle: 'border-line-strong hover:border-brand focus:border-focus',
  valid: 'border-success',
  invalid: 'border-danger',
}

function controlClass(state: FieldState = 'idle', className?: string): string {
  return cn(base, states[state], className)
}

interface FieldWrapperProps {
  label: string
  error?: string | undefined
  hint?: string | undefined
  state?: FieldState
  children: (props: {
    id: string
    describedBy: string | undefined
    invalid: boolean
    state: FieldState
  }) => ReactNode
}

export function Field({ label, error, hint, state, children }: FieldWrapperProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = error ? errorId : hint ? hintId : undefined
  const resolved: FieldState = error ? 'invalid' : (state ?? 'idle')

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-content">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error), state: resolved })}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface ControlProps {
  state?: FieldState
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & ControlProps
>(({ className, state, ...props }, ref) => (
  <input ref={ref} className={controlClass(state, className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & ControlProps
>(({ className, state, ...props }, ref) => (
  <textarea ref={ref} className={controlClass(state, cn('resize-none', className))} {...props} />
))
Textarea.displayName = 'Textarea'
