export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
  meta?: Record<string, unknown>
}

export interface ApiErrorBody {
  success: false
  message: string
  error: {
    code: string
    details?: unknown
  }
  meta?: Record<string, unknown>
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorBody
