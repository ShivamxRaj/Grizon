import { fetchEventSource } from '@microsoft/fetch-event-source'
import {
  buildStreamHeaders,
  ensureAccessToken,
  getApiBaseUrl,
  refreshApiSession,
} from '@/lib/api/client'
import { parseSseFrame } from './streamEvents'
import type { ChatSseEvent } from './types'

const AUTH_RETRY = 'SSE_AUTH_RETRY'

export interface StreamChatOptions {
  jobId: string
  signal?: AbortSignal
  onEvent: (event: ChatSseEvent) => void
  onOpen?: () => void
}

function parseFrameData(raw: string | undefined): unknown {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return { raw }
  }
}

async function connectOnce(url: string, opts: StreamChatOptions, allowRetry: boolean): Promise<void> {
  await ensureAccessToken()
  await fetchEventSource(url, {
    method: 'GET',
    signal: opts.signal,
    openWhenHidden: true,
    headers: buildStreamHeaders(),
    onopen: async (response) => {
      if (response.ok) {
        opts.onOpen?.()
        return
      }
      if (response.status === 401 && allowRetry) {
        const refreshed = await refreshApiSession()
        if (refreshed) throw new Error(AUTH_RETRY)
      }
      const text = await response.text().catch(() => '')
      throw new Error(text || `SSE failed: ${response.status}`)
    },
    onmessage: (ev) => {
      opts.onEvent(parseSseFrame(ev.event || 'message', parseFrameData(ev.data)))
    },
    onerror: (err) => {
      if (opts.signal?.aborted) return
      throw err instanceof Error ? err : new Error(String(err))
    },
  })
}

/** Subscribes to `GET /api/v1/chat/stream/:jobId` until the server closes. */
export async function streamChatJob(opts: StreamChatOptions): Promise<void> {
  const base = getApiBaseUrl().replace(/\/$/, '')
  const url = `${base}/api/v1/chat/stream/${encodeURIComponent(opts.jobId)}`
  try {
    await connectOnce(url, opts, true)
  } catch (error) {
    if (error instanceof Error && error.message === AUTH_RETRY) {
      await connectOnce(url, opts, false)
      return
    }
    throw error
  }
}
