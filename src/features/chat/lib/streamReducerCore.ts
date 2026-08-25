import type { ChatSseEvent } from '../api/types'
import {
  appendMarkdown,
  appendStatus,
  nextBlockId,
  summarizeArgs,
  summarizeOutput,
  upsertPhase,
  type StreamBlock,
  type StreamState,
} from './streamState'

function applyToolCall(
  state: StreamState,
  event: Extract<ChatSseEvent, { event: 'tool_call' }>,
): StreamState {
  const toolId = event.data.toolId ?? event.data.name ?? 'tool'
  const block: StreamBlock = {
    type: 'tool',
    callId: event.data.callId,
    toolId,
    phase: 'running',
    argsSummary: summarizeArgs(event.data.arguments),
  }
  return { ...state, phase: 'streaming', blocks: [...state.blocks, block] }
}

function applyToolResult(
  state: StreamState,
  event: Extract<ChatSseEvent, { event: 'tool_result' }>,
): StreamState {
  let found = false
  const blocks = state.blocks.map((block) => {
    if (block.type !== 'tool' || block.callId !== event.data.callId) return block
    found = true
    return {
      ...block,
      phase: 'done' as const,
      durationMs: event.data.durationMs,
      resultSummary: summarizeOutput(event.data.output, event.data.summary),
    }
  })
  if (found) return { ...state, blocks }
  return {
    ...state,
    blocks: [
      ...blocks,
      {
        type: 'tool',
        callId: event.data.callId || nextBlockId('tool'),
        toolId: event.data.toolId ?? 'tool',
        phase: 'done',
        durationMs: event.data.durationMs,
        resultSummary: summarizeOutput(event.data.output, event.data.summary),
      },
    ],
  }
}

function statusText(data: { content?: string; message?: string; phase?: string }): string | null {
  return data.content ?? data.message ?? data.phase ?? null
}

function applyQueued(state: StreamState, event: Extract<ChatSseEvent, { event: 'queued' }>): StreamState {
  const pos = event.data.position
  const label = typeof pos === 'number' ? `Queued (#${pos})` : 'Queued'
  return { ...state, phase: 'queued', blocks: upsertPhase(state.blocks, label) }
}

function applyProcessing(
  state: StreamState,
  event: Extract<ChatSseEvent, { event: 'processing' }>,
): StreamState {
  return {
    ...state,
    phase: state.phase === 'streaming' ? 'streaming' : 'processing',
    blocks: upsertPhase(state.blocks, 'Processing'),
    meta: {
      ...state.meta,
      agentSlug: event.data.agentSlug,
      modelId: event.data.modelId,
      modelProvider: event.data.modelProvider,
    },
  }
}

function applyArtifact(
  state: StreamState,
  event: Extract<ChatSseEvent, { event: 'artifact' }>,
): StreamState {
  return {
    ...state,
    blocks: [
      ...state.blocks,
      {
        type: 'artifact',
        artifactId: event.data.artifactId,
        title: event.data.title ?? event.data.filename,
        kind: event.data.kind ?? event.data.type,
        inlineData: event.data.inlineData,
        mimeType: event.data.mimeType,
      },
    ],
  }
}

function applyDone(state: StreamState, event: Extract<ChatSseEvent, { event: 'done' }>): StreamState {
  return {
    ...state,
    phase: 'completed',
    meta: {
      ...state.meta,
      messageId: event.data.messageId,
      conversationId: event.data.conversationId,
      durationMs: event.data.durationMs,
    },
  }
}

export function reduceStreamEvent(state: StreamState, event: ChatSseEvent): StreamState {
  switch (event.event) {
    case 'queued':
      return applyQueued(state, event)
    case 'processing':
      return applyProcessing(state, event)
    case 'status': {
      const text = statusText(event.data)
      return text ? { ...state, blocks: appendStatus(state.blocks, text) } : state
    }
    case 'chunk':
      return { ...state, phase: 'streaming', blocks: appendMarkdown(state.blocks, event.data.content) }
    case 'tool_call':
      return applyToolCall(state, event)
    case 'tool_result':
      return applyToolResult(state, event)
    case 'artifact':
      return applyArtifact(state, event)
    case 'usage':
      return { ...state, meta: { ...state.meta, creditsDeducted: event.data.creditsDeducted } }
    case 'done':
      return applyDone(state, event)
    case 'error':
      return {
        ...state,
        phase: 'error',
        error: { code: event.data.code, message: event.data.message ?? 'Stream failed' },
      }
    case 'cancelled':
      return {
        ...state,
        phase: 'cancelled',
        error: { message: event.data.reason ?? 'Cancelled' },
      }
    case 'heartbeat':
    case 'unknown':
      return state
  }
}
