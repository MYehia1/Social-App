import { Bell, BellOff, BellRing } from 'lucide-react'
import { Button } from '@/components/ui'
import { useI18n } from '@/i18n'
import { usePushNotifications } from '../../hooks'

/**
 * Turns browser push on or off for this device.
 *
 * Renders nothing where the browser cannot do push — Safari before 16.4,
 * private windows, insecure origins — because a control that can only fail is
 * worse than no control at all.
 */
export function PushToggle() {
  const { t } = useI18n()
  const { state, busy, toggle } = usePushNotifications()

  if (state === null || state === 'unsupported') return null

  const on = state === 'on'
  const blocked = state === 'blocked'
  const Icon = blocked ? BellOff : on ? BellRing : Bell

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => void toggle()}
      loading={busy}
      disabled={blocked}
      aria-pressed={on}
      title={blocked ? t('push.blockedHint') : undefined}
    >
      <Icon className="size-4" aria-hidden="true" />
      {blocked ? t('push.blocked') : on ? t('push.enabled') : t('push.enable')}
    </Button>
  )
}
