let accessToken: string | null = null

type Listener = (token: string | null) => void
const listeners = new Set<Listener>()

export const session = {
  get: (): string | null => accessToken,

  set(token: string) {
    accessToken = token
    listeners.forEach((fn) => fn(token))
  },

  clear() {
    accessToken = null
    listeners.forEach((fn) => fn(null))
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}
