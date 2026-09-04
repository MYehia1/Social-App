import type { Messaging } from 'firebase/messaging'

/*
 * Firebase project configuration, read from the environment.
 *
 * These values are public at runtime — they are compiled into the bundle and
 * anyone can read them in devtools. Keeping them in the environment is about
 * the repository, not the browser: nothing project-specific is committed, so
 * the same source builds against a different Firebase project by changing the
 * hosting config, and a public repo does not hand scrapers a ready-made set.
 *
 * Push is optional. With any of these unset the whole feature switches off —
 * the toggle hides, no SDK is ever loaded — exactly as Cloudinary and Google
 * sign-in do on the API side.
 */
interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

/** Web Push VAPID public key, from Firebase console → Cloud Messaging. */
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim() ?? ''

function readConfig(): FirebaseConfig | null {
  const values: Record<keyof FirebaseConfig, string | undefined> = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  const entries = Object.entries(values)
  if (!VAPID_KEY || entries.some(([, value]) => !value?.trim())) return null

  return Object.fromEntries(
    entries.map(([key, value]) => [key, (value as string).trim()]),
  ) as unknown as FirebaseConfig
}

const firebaseConfig = readConfig()

/** Whether this build has enough configuration to attempt push at all. */
export const pushConfigured = firebaseConfig !== null

/**
 * The service worker URL, with the configuration attached as query
 * parameters.
 *
 * A worker in `public/` is copied verbatim and cannot read `import.meta.env`,
 * so the only way to keep the config out of the repository is to hand it over
 * at registration time. The browser keys a registration by full URL, and this
 * one is stable across loads, so it does not re-register on every visit.
 */
export function serviceWorkerUrl(): string {
  if (!firebaseConfig) return '/firebase-messaging-sw.js'

  // Only the four keys Cloud Messaging actually needs; auth and storage play
  // no part in delivering a notification.
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  })

  return `/firebase-messaging-sw.js?${params.toString()}`
}

let messagingPromise: Promise<Messaging | null> | undefined

/**
 * Messaging, or null where it cannot work — an unconfigured build, Safari
 * before 16.4, any private window, and every insecure origin.
 *
 * The SDK is imported dynamically so that the ~56 kB of Firebase stays out of
 * the initial bundle: most visitors never turn push on, and the ones who do
 * pay for it once. The promise is cached because `isSupported()` runs real
 * feature detection there is no reason to repeat.
 */
export function getMessagingIfSupported(): Promise<Messaging | null> {
  messagingPromise ??= (async () => {
    if (!firebaseConfig) return null

    try {
      const [{ initializeApp }, { getMessaging, isSupported }] = await Promise.all([
        import('firebase/app'),
        import('firebase/messaging'),
      ])

      if (!(await isSupported())) return null
      return getMessaging(initializeApp(firebaseConfig))
    } catch {
      return null
    }
  })()

  return messagingPromise
}
