import { getMessagingIfSupported, serviceWorkerUrl, VAPID_KEY } from '@/lib/firebase'
import { pushApi } from '@/lib/api/social'

/**
 * Whether this browser opted in, tracked separately from the browser
 * permission.
 *
 * `Notification.permission` only ever moves forward: once granted it stays
 * granted, even after the user turns push off in Echoo. Deriving the toggle
 * from it alone would show "Push is on" again on the next page load, and
 * silently re-register the token. So consent lives here, per browser, next to
 * the token it belongs to.
 */
const OPT_IN_KEY = 'echoo:push'

/** The last token handed out, so it can be revoked without minting another. */
let currentToken: string | null = null

function optedIn(): boolean {
  try {
    return localStorage.getItem(OPT_IN_KEY) === 'on'
  } catch {
    // Storage throws outright in some privacy modes.
    return false
  }
}

function setOptedIn(value: boolean): void {
  try {
    if (value) localStorage.setItem(OPT_IN_KEY, 'on')
    else localStorage.removeItem(OPT_IN_KEY)
  } catch {
    // Nothing to do — the toggle still works for this page view.
  }
}

/**
 * A synchronous read of the opt-in flag, for callers that need to decide
 * whether to touch push at all before paying to load the SDK.
 */
export function isPushOptedIn(): boolean {
  return optedIn()
}

/** The lazily loaded half of the SDK, from the same chunk as the app. */
function messagingApi() {
  return import('firebase/messaging')
}

export type PushState = 'unsupported' | 'blocked' | 'on' | 'off'

export async function pushState(): Promise<PushState> {
  if (!('Notification' in window)) return 'unsupported'

  const messaging = await getMessagingIfSupported()
  if (!messaging) return 'unsupported'

  if (Notification.permission === 'denied') return 'blocked'
  return Notification.permission === 'granted' && optedIn() ? 'on' : 'off'
}

/**
 * Registers the service worker and mints a token for it.
 *
 * The worker is registered explicitly, rather than left for the SDK to find,
 * so the registration has settled before a token is asked for — otherwise
 * `getToken` races the install and fails on a cold first visit.
 */
async function registerToken(): Promise<string | null> {
  const messaging = await getMessagingIfSupported()
  if (!messaging) return null

  const { getToken } = await messagingApi()

  const registration = await navigator.serviceWorker.register(serviceWorkerUrl(), {
    scope: '/',
  })
  await navigator.serviceWorker.ready

  return getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  })
}

/**
 * Turns push on for this browser.
 *
 * Asking for permission is a one-shot: a browser that has denied once will
 * not prompt again, and the only way back is the site settings panel. So this
 * only ever runs from a deliberate click, never on page load.
 */
export async function enablePush(): Promise<PushState> {
  if (!('Notification' in window)) return 'unsupported'
  if (!(await getMessagingIfSupported())) return 'unsupported'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off'

  const token = await registerToken()
  if (!token) return 'off'

  currentToken = token
  await pushApi.subscribe(token)
  setOptedIn(true)
  return 'on'
}

/**
 * Turns push off for this browser only.
 *
 * The token is dropped server-side first: had the local delete succeeded and
 * the request failed, the API would keep pushing to an address the browser
 * can no longer receive on.
 */
export async function disablePush(): Promise<void> {
  setOptedIn(false)

  const messaging = await getMessagingIfSupported()
  if (!messaging) return

  const { deleteToken, getToken } = await messagingApi()
  const token =
    currentToken ??
    (await getToken(messaging, { vapidKey: VAPID_KEY }).catch(() => null))

  if (token) {
    await pushApi.unsubscribe(token).catch(() => undefined)
    await deleteToken(messaging).catch(() => undefined)
  }

  currentToken = null
}

/**
 * Re-registers the token for a browser that already opted in.
 *
 * Firebase rotates registration tokens, and a token also dies when site data
 * is cleared. Without this the button would keep claiming push is on long
 * after the server had stopped being able to reach the browser.
 */
export async function refreshPushToken(): Promise<void> {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted' || !optedIn()) return

  const token = await registerToken()
  if (!token || token === currentToken) return

  currentToken = token
  await pushApi.subscribe(token)
}

/**
 * Messages that arrive while the tab is focused.
 *
 * The service worker deliberately ignores these — an OS banner for the page
 * you are already looking at is noise — so the app surfaces them itself.
 */
export async function onForegroundMessage(
  handler: (message: {
    title: string
    body?: string | undefined
    path?: string | undefined
  }) => void,
): Promise<() => void> {
  const messaging = await getMessagingIfSupported()
  if (!messaging) return () => undefined

  const { onMessage } = await messagingApi()

  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title
    if (!title) return
    handler({
      title,
      body: payload.notification?.body,
      path: payload.data?.path,
    })
  })
}
