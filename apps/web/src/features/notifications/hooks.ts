import { useCallback, useEffect, useState } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { notificationsApi } from '@/lib/api/social'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/providers/auth-context'
import { toLocalisedMessage, useI18n } from '@/i18n'
import {
  disablePush,
  enablePush,
  isPushOptedIn,
  onForegroundMessage,
  pushState,
  refreshPushToken,
  type PushState,
} from './push'

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notificationList(),
    queryFn: ({ pageParam }) => notificationsApi.list(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })
}


export function useUnreadCount() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: queryKeys.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  })
}

export function useMarkAllRead() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: async () => {
      queryClient.setQueryData(queryKeys.unreadCount(), 0)
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
      toast.success(t('toast.allCaughtUp'))
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

/**
 * Push state for this browser, and the one action that changes it.
 *
 * `state` starts as null while support is being detected, so the button stays
 * out of the way rather than flashing the wrong label first.
 */
export function usePushNotifications() {
  const { t } = useI18n()
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    void pushState().then((value) => {
      if (active) setState(value)
    })
    return () => {
      active = false
    }
  }, [])

  const toggle = useCallback(async () => {
    setBusy(true)
    try {
      if (state === 'on') {
        await disablePush()
        setState('off')
        toast.success(t('push.disabledToast'))
        return
      }

      const result = await enablePush()
      setState(result)

      if (result === 'on') toast.success(t('push.enabledToast'))
      else if (result === 'blocked') toast.error(t('push.blockedHint'))
    } catch {
      toast.error(t('push.failed'))
    } finally {
      setBusy(false)
    }
  }, [state, t])

  return { state, busy, toggle }
}

/**
 * Surfaces pushes that land while the tab is focused.
 *
 * The service worker leaves these alone — an OS banner for the page already
 * on screen is noise — so they become a toast and a badge refresh instead.
 */
export function useForegroundPush() {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    // No permission means no push can arrive, so there is nothing to listen
    // for — and checking here keeps the Firebase chunk off the critical path
    // for everyone who has not opted in.
    if (!isAuthenticated) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    if (!isPushOptedIn()) return

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    // Tokens rotate, so the one the server holds may already be dead.
    void refreshPushToken().catch(() => undefined)

    void onForegroundMessage((message) => {
      toast(message.body ? `${message.title} — ${message.body}` : message.title)
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
    }).then((off) => {
      if (cancelled) off()
      else unsubscribe = off
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [isAuthenticated, queryClient])
}

export function useMarkRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
    },


    onError: () => undefined,
  })
}
