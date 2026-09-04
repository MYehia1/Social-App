import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { env, pushEnabled } from '../../config/config'
import { NotificationEnum } from '../enums'

/**
 * Web push through Firebase Cloud Messaging.
 *
 * Entirely optional: with no service account configured every function here
 * turns into a no-op and the app falls back to its polled in-app feed. That
 * keeps a local checkout runnable without a Firebase project.
 */

let app: App | undefined

function messaging() {
  if (!pushEnabled) return null

  if (!app) {
    // Reuse an existing app on a hot reload rather than throwing on the
    // duplicate-name error tsx watch would otherwise trigger.
    app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID as string,
          clientEmail: env.FIREBASE_CLIENT_EMAIL as string,
          // Render and most dashboards store the key on one line with
          // literal backslash-n, which the PEM parser rejects.
          privateKey: (env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
        }),
      })
  }

  return getMessaging(app)
}

const VERBS: Record<NotificationEnum, string> = {
  [NotificationEnum.REACTION]: 'reacted to your post',
  [NotificationEnum.COMMENT]: 'commented on your post',
  [NotificationEnum.REPLY]: 'replied to your comment',
  [NotificationEnum.MENTION_POST]: 'mentioned you in a post',
  [NotificationEnum.MENTION_COMMENT]: 'mentioned you in a comment',
  [NotificationEnum.FRIEND_REQUEST]: 'sent you a friend request',
  [NotificationEnum.FRIEND_ACCEPTED]: 'accepted your friend request',
}

function truncate(text: string, max = 120): string {
  const trimmed = text.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed
}

export interface PushPayload {
  actorName: string
  type: NotificationEnum
  /** A short excerpt of the post or comment, shown as the body. */
  excerpt?: string | undefined
  /** Where clicking the notification should land. */
  path: string
}

/**
 * Delivers to every device the recipient has registered and reports back the
 * tokens the service rejected, so the caller can drop them.
 *
 * A token dies whenever the browser clears site data or the subscription is
 * revoked. Left in place they accumulate for ever and every send wastes a
 * round trip on an address that can never receive anything again.
 */
export async function sendPush(
  tokens: string[],
  payload: PushPayload,
): Promise<{ staleTokens: string[] }> {
  const client = messaging()
  if (!client || tokens.length === 0) return { staleTokens: [] }

  const link = `${env.ORIGINS[0] ?? ''}${payload.path}`

  try {
    const response = await client.sendEachForMulticast({
      tokens,
      notification: {
        title: `${payload.actorName} ${VERBS[payload.type]}`,
        ...(payload.excerpt ? { body: truncate(payload.excerpt) } : {}),
      },
      webpush: {
        notification: {
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          // One notification per type, so ten reactions do not stack ten
          // banners on the lock screen.
          tag: payload.type,
        },
        fcmOptions: link ? { link } : {},
      },
      data: { type: payload.type, path: payload.path },
    })

    const staleTokens = response.responses.flatMap((result, index) => {
      const code = result.error?.code
      const isDead =
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument'
      const token = tokens[index]
      return isDead && token ? [token] : []
    })

    return { staleTokens }
  } catch (error) {
    // A push failure must never take down the action that produced it.
    console.error('Push delivery failed:', error)
    return { staleTokens: [] }
  }
}

/** Confirms the service account can actually mint a token, at boot. */
export async function verifyPushTransport(): Promise<boolean> {
  const client = messaging()
  if (!client) return false

  try {
    // Sending to an obviously invalid token still forces the credential
    // exchange, which is the part that fails on a bad service account.
    await client.send({ token: 'echoo-connectivity-probe' }, true)
    return true
  } catch (error) {
    const code = (error as { code?: string }).code ?? ''
    // The token was rejected, which means authentication succeeded.
    if (code.startsWith('messaging/')) return true
    console.warn('⚠️  Firebase push disabled:', (error as Error).message)
    return false
  }
}
