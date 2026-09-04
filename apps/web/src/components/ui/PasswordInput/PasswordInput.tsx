import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Input, type FieldState } from '../Field'
import { useI18n } from '@/i18n'


export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { state?: FieldState }
>(({ className, state, ...props }, ref) => {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        state={state}
        className={cn('pe-10', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? t('auth.field.hidePassword') : t('auth.field.showPassword')}
        aria-pressed={visible}


        onMouseDown={(event) => event.preventDefault()}
        className="absolute end-1 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-subtle transition-colors hover:text-content"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
})
PasswordInput.displayName = 'PasswordInput'
