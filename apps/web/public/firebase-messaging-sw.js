/*
 * Firebase Cloud Messaging service worker.
 *
 * This has to live at the origin root and load its own copy of the SDK: a
 * service worker cannot import from the bundle, and a file in public/ is
 * copied verbatim, so it cannot read the build-time environment either.
 *
 * The app therefore passes the configuration on the registration URL — see
 * `serviceWorkerUrl()` in src/lib/firebase.ts. That keeps the project keys in
 * the hosting environment rather than committed here.
 *
 * No onBackgroundMessage handler is registered on purpose. Messages arrive
 * with a `notification` block, which the SDK displays by itself; adding a
 * handler that also called showNotification would produce two banners for
 * every notification.
 */
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js')

const params = new URL(self.location).searchParams

const apiKey = params.get('apiKey')
const projectId = params.get('projectId')
const messagingSenderId = params.get('messagingSenderId')
const appId = params.get('appId')

// Registered without configuration, the SDK would throw on every activation
// and the worker would look broken rather than simply unconfigured.
if (apiKey && projectId && messagingSenderId && appId) {
  firebase.initializeApp({ apiKey, projectId, messagingSenderId, appId })
  firebase.messaging()
}
