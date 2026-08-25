import { useCallback, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/api/errors'
import { cancelChat, enqueueChat } from '../api/chat'
import { streamChatJob } from '../api/stream'
import type { ChatSseEvent } from '../api/types'
import {
  INITIAL_STREAM_STATE,
  reduceStreamEvent,
  type StreamState,
} from '../lib/streamReducer'

export interface SendChatInput {
  conversationId: string
  content: string
  agentSlug?: string | null
  clientMessageId?: string
  attachedFileIds?: string[]
}

export interface UseChatStreamResult {
  state: StreamState
  isStreaming: boolean
  send: (input: SendChatInput) => Promise<void>
  cancel: (conversationId: string) => Promise<void>
  reset: () => void
}

const TERMINAL: ReadonlySet<StreamState['phase']> = new Set([
  'completed',
  'error',
  'cancelled',
])

function isTerminalEvent(event: ChatSseEvent): boolean {
  return event.event === 'done' || event.event === 'error' || event.event === 'cancelled'
}

function createQueuedState(): StreamState {
  return {
    ...INITIAL_STREAM_STATE,
    phase: 'queued',
    blocks: [{ type: 'phase', id: 'phase-start', label: 'Queued' }],
  }
}

async function runStreamJob(
  input: SendChatInput,
  signal: AbortSignal,
  onEvent: (event: ChatSseEvent) => void,
): Promise<void> {
  const enqueued = await enqueueChat({
    conversationId: input.conversationId,
    clientMessageId: input.clientMessageId ?? crypto.randomUUID(),
    content: input.content,
    agentSlug: input.agentSlug,
    attachedFileIds: input.attachedFileIds,
  })
  await streamChatJob({ jobId: enqueued.jobId, signal, onEvent })
}

export function useChatStream(onTerminal?: (state: StreamState) => void): UseChatStreamResult {
  const [state, setState] = useState<StreamState>(INITIAL_STREAM_STATE)
  const abortRef = useRef<AbortController | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const reset = useCallback((): void => {
    abortRef.current?.abort()
    abortRef.current = null
    setState(INITIAL_STREAM_STATE)
  }, [])

  const applyEvent = useCallback((event: ChatSseEvent): StreamState => {
    const next = reduceStreamEvent(stateRef.current, event)
    stateRef.current = next
    setState(next)
    return next
  }, [])

  const send = useCallback(
    async (input: SendChatInput): Promise<void> => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const starting = createQueuedState()
      stateRef.current = starting
      setState(starting)

      try {
        await runStreamJob(input, controller.signal, (event) => {
          const next = applyEvent(event)
          if (isTerminalEvent(event)) onTerminal?.(next)
        })
      } catch (error) {
        if (controller.signal.aborted) return
        const failed: StreamState = {
          ...stateRef.current,
          phase: 'error',
          error: { message: getApiErrorMessage(error, 'Failed to stream response') },
        }
        stateRef.current = failed
        setState(failed)
        onTerminal?.(failed)
      } finally {
        if (abortRef.current === controller) abortRef.current = null
      }
    },
    [applyEvent, onTerminal],
  )

  const cancel = useCallback(async (conversationId: string): Promise<void> => {
    abortRef.current?.abort()
    abortRef.current = null
    try {
      await cancelChat(conversationId)
    } catch {
      // Local abort still stops the UI stream even if cancel API fails.
    }
    setState((prev) => ({ ...prev, phase: 'cancelled', error: { message: 'Cancelled' } }))
  }, [])

  return {
    state,
    isStreaming: !TERMINAL.has(state.phase) && state.phase !== 'idle',
    send,
    cancel,
    reset,
  }
}
