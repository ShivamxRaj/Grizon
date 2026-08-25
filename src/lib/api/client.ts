import { ApiError } from './errors'
import { isRecord, isString } from './guards'

const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim() !== '') ? import.meta.env.VITE_API_BASE_URL : 'https://grizon-backend.onrender.com'

const PLATFORM_HEADER = 'web'

type AccessTokenGetter = () => string | null
type SessionClearHandler = () => void
type RefreshHandler = () => Promise<boolean>

let getAccessToken: AccessTokenGetter = () => null
let onSessionCleared: SessionClearHandler = () => undefined
let refreshSession: RefreshHandler | null = null
let refreshInFlight: Promise<boolean> | null = null

export function configureApiAuth(options: {
  getAccessToken: AccessTokenGetter
  refreshSession: RefreshHandler
  onSessionCleared: SessionClearHandler
}): void {
  getAccessToken = options.getAccessToken
  refreshSession = options.refreshSession
  onSessionCleared = options.onSessionCleared
}

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

export function peekAccessToken(): string | null {
  return getAccessToken()
}

/** Refresh once (deduped) and return a fresh access token, or null if session is gone. */
export async function ensureAccessToken(): Promise<string | null> {
  const current = getAccessToken()
  if (current) return current
  const refreshed = await runRefreshOnce()
  if (!refreshed) {
    onSessionCleared()
    return null
  }
  return getAccessToken()
}

/** Auth + platform headers without forcing JSON Content-Type (for SSE). */
export function buildStreamHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    accept: 'text/event-stream',
    'x-platform': PLATFORM_HEADER,
    'x-device-name': deviceNameHint(),
    ...extra,
  }
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function refreshApiSession(): Promise<boolean> {
  return runRefreshOnce()
}

export interface ApiFetchOptions {
  method?: string
  body?: unknown
  auth?: boolean
  skipRefresh?: boolean
  headers?: Record<string, string>
}

function deviceNameHint(): string {
  try {
    const platform = navigator.platform || 'Web'
    return `Web (${platform})`
  } catch {
    return 'Web'
  }
}

function buildHeaders(options: ApiFetchOptions): Headers {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('x-platform', PLATFORM_HEADER)
  if (!headers.has('x-device-name')) headers.set('x-device-name', deviceNameHint())
  if (options.auth) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}

async function readBodyUnknown(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  const parsed: unknown = JSON.parse(text)
  return parsed
}

function throwFromEnvelope(status: number, body: unknown): never {
  if (isRecord(body) && body.success === false && isRecord(body.error)) {
    const code = isString(body.error.code) ? body.error.code : 'UNKNOWN_ERROR'
    const message = isString(body.message) ? body.message : 'Request failed'
    throw new ApiError(status, code, message, body.error.details)
  }
  throw new ApiError(status, 'HTTP_ERROR', `API request failed (${status})`)
}

function parseSuccessData<T>(body: unknown, parseData: (data: unknown) => T): T {
  if (!isRecord(body) || body.success !== true) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Unexpected API response shape')
  }
  return parseData(body.data)
}

async function runRefreshOnce(): Promise<boolean> {
  if (!refreshSession) return false
  if (!refreshInFlight) {
    refreshInFlight = refreshSession().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

async function requestOnce(path: string, options: ApiFetchOptions): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
    headers: buildHeaders(options),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions,
  parseData: (data: unknown) => T,
): Promise<T> {
  const response = await requestOnce(path, options)
  if (response.status === 204) {
    return parseData(null)
  }

  if (response.status === 401 && options.auth && !options.skipRefresh) {
    await response.text()
    const refreshed = await runRefreshOnce()
    if (refreshed) {
      const retry = await requestOnce(path, { ...options, skipRefresh: true })
      if (retry.status === 204) return parseData(null)
      const retryBody = await readBodyUnknown(retry)
      if (!retry.ok) throwFromEnvelope(retry.status, retryBody)
      return parseSuccessData(retryBody, parseData)
    }
    onSessionCleared()
    throw new ApiError(401, 'NOT_AUTHENTICATED', 'Session expired. Please log in again.')
  }

  const body = await readBodyUnknown(response)
  if (!response.ok) throwFromEnvelope(response.status, body)
  return parseSuccessData(body, parseData)
}

export async function apiFetchNoContent(path: string, options: ApiFetchOptions): Promise<void> {
  await apiFetch(path, options, (data) => {
    if (data !== null) {
      throw new ApiError(500, 'INVALID_RESPONSE', 'Expected empty response body')
    }
    return undefined
  })
}

function buildBlobHeaders(options: ApiFetchOptions): Headers {
  const headers = new Headers(options.headers)
  headers.set('x-platform', PLATFORM_HEADER)
  if (!headers.has('x-device-name')) headers.set('x-device-name', deviceNameHint())
  if (options.auth) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}

async function requestBlobOnce(path: string, options: ApiFetchOptions): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: buildBlobHeaders(options),
  })
}

async function throwFromBlobFailure(response: Response): Promise<never> {
  let message = response.statusText || `Download failed (${response.status})`
  try {
    const text = await response.text()
    const parsed: unknown = text ? JSON.parse(text) : null
    if (isRecord(parsed) && isString(parsed.message)) message = parsed.message
  } catch {
    // Keep status text when the body is not JSON.
  }
  throw new ApiError(response.status, 'HTTP_ERROR', message)
}

/** Authenticated download of raw bytes (no JSON envelope). */
export async function apiFetchBlob(path: string, options: ApiFetchOptions = {}): Promise<Blob> {
  const opts: ApiFetchOptions = { ...options, auth: options.auth ?? true, method: options.method ?? 'GET' }
  const response = await requestBlobOnce(path, opts)

  if (response.status === 401 && opts.auth && !opts.skipRefresh) {
    await response.arrayBuffer()
    const refreshed = await runRefreshOnce()
    if (refreshed) {
      const retry = await requestBlobOnce(path, { ...opts, skipRefresh: true })
      if (!retry.ok) await throwFromBlobFailure(retry)
      return retry.blob()
    }
    onSessionCleared()
    throw new ApiError(401, 'NOT_AUTHENTICATED', 'Session expired. Please log in again.')
  }

  if (!response.ok) await throwFromBlobFailure(response)
  return response.blob()
}
