import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <dialog
      ref={ref}

      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}

      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
      className={cn(
        'm-auto w-[calc(100vw-2rem)] max-w-lg rounded-card border border-line bg-surface p-0',
        'text-content shadow-[var(--shadow-pop)] backdrop:bg-black/50 backdrop:backdrop-blur-sm',
        'open:animate-in',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 id="modal-title" className="text-base font-semibold">
            {title}
          </h2>
          {description && (
            <p id="modal-description" className="mt-1 text-sm text-muted">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="-mr-1 -mt-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-hover hover:text-content"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="px-5 py-4">{children}</div>

      {footer && (
        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
          {footer}
        </div>
      )}
    </dialog>
  )
}
