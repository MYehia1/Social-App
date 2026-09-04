import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useResendCode, useVerifyCode } from '@/features/auth/hooks'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'

const LENGTH = 6

const FALLBACK_TTL_MS = 2 * 60 * 1000

function secondsLeft(expiresAt: number): number {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
}

function mmss(total: number): string {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function VerifyEmailPage() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''


  const [expiresAt, setExpiresAt] = useState(() => {
    const fromUrl = params.get('expires')
    const parsed = fromUrl ? Date.parse(fromUrl) : Number.NaN
    return Number.isNaN(parsed) ? Date.now() + FALLBACK_TTL_MS : parsed
  })

  const [digits, setDigits] = useState<string[]>(() => Array<string>(LENGTH).fill(''))
  const [remaining, setRemaining] = useState(() => secondsLeft(expiresAt))
  const [burned, setBurned] = useState(false)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  const verify = useVerifyCode()
  const resend = useResendCode()

  const code = digits.join('')
  const complete = code.length === LENGTH
  const expired = remaining === 0


  const canResend = (expired || burned) && !resend.isPending

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])



  useEffect(() => {
    setRemaining(secondsLeft(expiresAt))
    if (secondsLeft(expiresAt) === 0) return

    const timer = window.setInterval(() => {
      const left = secondsLeft(expiresAt)
      setRemaining(left)
      if (left === 0) window.clearInterval(timer)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [expiresAt])

  function write(index: number, value: string) {

    const cleaned = value.replace(/\D/g, '')
    if (!cleaned) return

    setDigits((previous) => {
      const next = [...previous]
      for (let offset = 0; offset < cleaned.length && index + offset < LENGTH; offset += 1) {
        next[index + offset] = cleaned[offset] as string
      }
      return next
    })

    const landed = Math.min(index + cleaned.length, LENGTH - 1)
    inputs.current[landed]?.focus()
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      setDigits((previous) => {
        const next = [...previous]

        if (next[index]) next[index] = ''
        else if (index > 0) {
          next[index - 1] = ''
          inputs.current[index - 1]?.focus()
        }
        return next
      })
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < LENGTH - 1) {
      inputs.current[index + 1]?.focus()
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!complete || expired) return

    verify.mutate(
      { email, code },
      {
        onError: (error) => {


          if (error instanceof ApiError && /too many/i.test(error.message)) {
            setBurned(true)
          }
          setDigits(Array<string>(LENGTH).fill(''))
          inputs.current[0]?.focus()
        },
      },
    )
  }

  function requestNewCode() {
    resend.mutate(email, {
      onSuccess: ({ expiresAt: next }) => {
        setBurned(false)
        setDigits(Array<string>(LENGTH).fill(''))
        setExpiresAt(next ? Date.parse(next) : Date.now() + FALLBACK_TTL_MS)
        inputs.current[0]?.focus()
      },
    })
  }


  if (!email) return <Navigate to="/register" replace />

  const locked = expired || burned

  return (
    <AuthLayout
      title="Check your email"
      subtitle={`We sent a six-digit code to ${email}.`}
      footer={
        <>
          Wrong address?{' '}
          <Link to="/register" className="font-medium text-brand-text hover:underline">
            Start over
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <div
            className="flex justify-between gap-2"
            role="group"
            aria-label="Verification code"
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputs.current[index] = element
                }}
                value={digit}
                onChange={(event) => write(index, event.target.value)}
                onKeyDown={(event) => onKeyDown(index, event)}
                onFocus={(event) => event.target.select()}
                disabled={locked}
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={LENGTH}
                aria-label={t('auth.verify.digit', { index: index + 1 })}
                className={cn(
                  'h-14 w-full rounded-lg border bg-surface text-center text-xl font-semibold',
                  'text-content transition-colors',
                  'disabled:cursor-not-allowed disabled:opacity-50',


                  digit ? 'border-brand' : 'border-line-strong',
                )}
              />
            ))}
          </div>

          <p
            className={cn('mt-2 text-xs', locked ? 'text-danger' : 'text-subtle')}

            aria-live={remaining === 0 ? 'polite' : 'off'}
          >
            {burned
              ? 'Too many incorrect attempts. Request a new code.'
              : expired
                ? 'That code expired. Request a new one.'
                : `Expires in ${mmss(remaining)} · 3 attempts`}
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={verify.isPending}
          disabled={!complete || locked}
        >
          Verify and continue
        </Button>

        <button
          type="button"
          onClick={requestNewCode}
          disabled={!canResend}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 text-center text-sm text-muted transition-colors hover:text-content disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCw
            className={cn('size-3.5', resend.isPending && 'animate-spin')}
            aria-hidden="true"
          />
          {canResend
            ? 'Send a new code'
            : resend.isPending
              ? 'Sending…'
              : `Send a new code in ${mmss(remaining)}`}
        </button>
      </form>
    </AuthLayout>
  )
}
