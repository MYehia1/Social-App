import { useCallback, useEffect, useRef, useState } from 'react'
import { Spinner } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { useGoogleAuth } from '../../hooks'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID


export const GOOGLE_SIGNIN_CONFIGURED = Boolean(CLIENT_ID)
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'


interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string
        callback: (response: { credential: string }) => void
      }) => void
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}


function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={cn('size-5', className)}>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  )
}


const GIS_BUTTON = '[role="button"], div[tabindex]'


let scriptPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {

      scriptPromise = null
      reject(new Error('Could not load Google sign-in'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

type Status = 'loading' | 'ready' | 'failed'


export function GoogleButton({
  text = 'signin_with',
  onUnavailable,
}: {
  text?: 'signin_with' | 'signup_with'

  onUnavailable?: () => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()
  const googleAuth = useGoogleAuth()
  const [status, setStatus] = useState<Status>('loading')



  const onCredential = useRef(googleAuth.mutate)
  onCredential.current = googleAuth.mutate

  const render = useCallback(() => {
    const host = hostRef.current
    if (!host || !window.google || !CLIENT_ID) return false



    host.replaceChildren()

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: ({ credential }) => onCredential.current(credential),
    })

    window.google.accounts.id.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text,
      shape: 'rectangular',
      width: 320,
    })






    const rendered = host.querySelector<HTMLElement>(GIS_BUTTON)
    if (!rendered) return false



    rendered.setAttribute('tabindex', '-1')
    return true
  }, [text])

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false

    void loadGoogleScript()
      .then(() => {
        if (cancelled) return
        if (render()) {
          setStatus('ready')
        } else {
          setStatus('failed')
          onUnavailable?.()
        }
      })
      .catch(() => {


        if (cancelled) return
        setStatus('failed')
        onUnavailable?.()
      })

    return () => {
      cancelled = true
    }
  }, [render, onUnavailable])


  function activate() {
    const host = hostRef.current
    if (!host) return
    host.querySelector<HTMLElement>(GIS_BUTTON)?.click()
  }

  if (!CLIENT_ID || status === 'failed') return null

  const pending = googleAuth.isPending
  const label = text === 'signup_with' ? t('auth.google.signup') : t('auth.google.signin')

  return (
    <div className="relative">
      {}
      <div
        ref={hostRef}
        aria-hidden="true"



        inert
        className="pointer-events-none absolute size-px overflow-hidden opacity-0"
      />

      <button
        type="button"
        onClick={activate}
        disabled={pending || status !== 'ready'}
        aria-busy={pending || undefined}
        className={cn(
          'inline-flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-lg',
          'border border-line-strong bg-surface text-[0.9375rem] font-medium text-content',
          'transition-colors hover:bg-surface-hover',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        {pending ? (
          <>
            <Spinner />
            {t('auth.google.pending')}
          </>
        ) : (
          <>
            <GoogleMark />
            {label}
          </>
        )}
      </button>
    </div>
  )
}
