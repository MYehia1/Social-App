import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { session } from '@/lib/session'
import type { ErrorEnvelope } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export const http = axios.create({
  baseURL: `${BASE_URL}/api/v1`,

  withCredentials: true,
  timeout: 20_000,
})

export interface FieldError {
  field: string
  message: string
}


export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: FieldError[]

  readonly details: unknown

  constructor(
    message: string,
    status: number,
    code: string,
    details: unknown = undefined,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details


    this.fields = Array.isArray(details) ? (details as FieldError[]) : []
  }

  get isNetworkError(): boolean {
    return this.status === 0
  }
}

http.interceptors.request.use((config) => {
  const token = session.get()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})






let refreshInFlight: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= axios
    .post<{ data: { accessToken: string } }>(
      `${BASE_URL}/api/v1/auth/refresh`,
      {},
      { withCredentials: true },
    )
    .then((response) => {
      const token = response.data.data.accessToken
      session.set(token)
      return token
    })
    .finally(() => {
      refreshInFlight = null
    })

  return refreshInFlight
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorEnvelope>) => {
    const config = error.config as RetriableConfig | undefined

    if (!error.response) {




      const hint = import.meta.env.DEV ? ` (no reply from ${BASE_URL})` : ''
      throw new ApiError(
        `Can't reach Echoo right now. Check your connection, then try again.${hint}`,
        0,
        'NETWORK_ERROR',
      )
    }

    const { status, data } = error.response
    const isRefreshCall = config?.url?.includes('/auth/refresh')


    if (status === 401 && config && !config._retried && !isRefreshCall) {
      config._retried = true
      try {
        const token = await refreshAccessToken()
        config.headers.set('Authorization', `Bearer ${token}`)
        return http(config)
      } catch {
        session.clear()
      }
    }

    if (status === 401) session.clear()

    throw new ApiError(
      data?.error?.message ?? 'Something went wrong. Try again in a moment.',
      status,
      data?.error?.code ?? 'UNKNOWN',
      data?.error?.details,
    )
  },
)


export async function restoreSession(): Promise<boolean> {
  try {
    await refreshAccessToken()
    return true
  } catch {
    return false
  }
}


