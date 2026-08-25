import { isNumber, isRecord, isString } from '@/lib/api/guards'
import type {
  ChatSseEvent,
  ChatSseEventName,
  SseArtifactData,
  SseCancelledData,
  SseChunkData,
  SseDoneData,
  SseErrorData,
  SseProcessingData,
  SseQueuedData,
  SseStatusData,
  SseToolCallData,
  SseToolResultData,
  SseUsageData,
} from './types'

const KNOWN_EVENTS: ReadonlySet<string> = new Set([
  'queued',
  'processing',
  'status',
  'chunk',
  'tool_call',
  'tool_result',
  'artifact',
  'usage',
  'done',
  'error',
  'cancelled',
  'heartbeat',
])

function asRecord(data: unknown): Record<string, unknown> {
  return isRecord(data) ? data : {}
}

function parseQueued(data: Record<string, unknown>): SseQueuedData {
  return { position: isNumber(data.position) ? data.position : undefined }
}

function parseProcessing(data: Record<string, unknown>): SseProcessingData {
  return {
    agentSlug: isString(data.agentSlug) || data.agentSlug === null ? data.agentSlug : undefined,
    modelId: isString(data.modelId) || data.modelId === null ? data.modelId : undefined,
    modelProvider:
      isString(data.modelProvider) || data.modelProvider === null ? data.modelProvider : undefined,
  }
}

function parseStatus(data: Record<string, unknown>): SseStatusData {
  return {
    content: isString(data.content) ? data.content : undefined,
    phase: isString(data.phase) ? data.phase : undefined,
    message: isString(data.message) ? data.message : undefined,
  }
}

function parseChunk(data: Record<string, unknown>): SseChunkData {
  return { content: isString(data.content) ? data.content : '' }
}

function parseToolCall(data: Record<string, unknown>): SseToolCallData {
  return {
    callId: isString(data.callId) ? data.callId : crypto.randomUUID(),
    toolId: isString(data.toolId) ? data.toolId : undefined,
    name: isString(data.name) ? data.name : undefined,
    arguments: data.arguments,
  }
}

function parseToolResult(data: Record<string, unknown>): SseToolResultData {
  return {
    callId: isString(data.callId) ? data.callId : '',
    toolId: isString(data.toolId) ? data.toolId : undefined,
    output: data.output,
    durationMs: isNumber(data.durationMs) ? data.durationMs : undefined,
    summary: isString(data.summary) ? data.summary : undefined,
  }
}

function parseArtifact(data: Record<string, unknown>): SseArtifactData {
  return {
    artifactId: isString(data.artifactId) ? data.artifactId : '',
    type: isString(data.type) ? data.type : undefined,
    kind: isString(data.kind) ? data.kind : undefined,
    title: isString(data.title) ? data.title : undefined,
    filename: isString(data.filename) ? data.filename : undefined,
    messageId: isString(data.messageId) ? data.messageId : undefined,
    inlineData: isString(data.inlineData) ? data.inlineData : undefined,
    mimeType: isString(data.mimeType) ? data.mimeType : undefined,
  }
}

function parseUsage(data: Record<string, unknown>): SseUsageData {
  const tokens = isRecord(data.tokensUsed) ? data.tokensUsed : null
  return {
    creditsDeducted: isNumber(data.creditsDeducted) ? data.creditsDeducted : undefined,
    tokensUsed: tokens
      ? {
          inputFresh: isNumber(tokens.inputFresh) ? tokens.inputFresh : 0,
          inputCached: isNumber(tokens.inputCached) ? tokens.inputCached : 0,
          output: isNumber(tokens.output) ? tokens.output : 0,
          cacheWrite: isNumber(tokens.cacheWrite) ? tokens.cacheWrite : 0,
        }
      : undefined,
  }
}

function parseDone(data: Record<string, unknown>): SseDoneData {
  return {
    messageId: isString(data.messageId) ? data.messageId : '',
    conversationId: isString(data.conversationId) ? data.conversationId : '',
    status: 'completed',
    durationMs: isNumber(data.durationMs) ? data.durationMs : undefined,
    llmFirstTokenMs: isNumber(data.llmFirstTokenMs) ? data.llmFirstTokenMs : null,
    llmTotalMs: isNumber(data.llmTotalMs) ? data.llmTotalMs : null,
    title: isString(data.title) ? data.title : undefined,
  }
}

function parseError(data: Record<string, unknown>): SseErrorData {
  return {
    code: isString(data.code) ? data.code : undefined,
    message: isString(data.message) ? data.message : undefined,
    retryable: data.retryable === true,
  }
}

function parseCancelled(data: Record<string, unknown>): SseCancelledData {
  return { reason: isString(data.reason) ? data.reason : undefined }
}

export function parseSseFrame(eventName: string, raw: unknown): ChatSseEvent {
  const name = eventName || 'message'
  const data = asRecord(raw)
  if (!KNOWN_EVENTS.has(name)) return { event: 'unknown', name, data }

  switch (name as ChatSseEventName) {
    case 'queued':
      return { event: 'queued', data: parseQueued(data) }
    case 'processing':
      return { event: 'processing', data: parseProcessing(data) }
    case 'status':
      return { event: 'status', data: parseStatus(data) }
    case 'chunk':
      return { event: 'chunk', data: parseChunk(data) }
    case 'tool_call':
      return { event: 'tool_call', data: parseToolCall(data) }
    case 'tool_result':
      return { event: 'tool_result', data: parseToolResult(data) }
    case 'artifact':
      return { event: 'artifact', data: parseArtifact(data) }
    case 'usage':
      return { event: 'usage', data: parseUsage(data) }
    case 'done':
      return { event: 'done', data: parseDone(data) }
    case 'error':
      return { event: 'error', data: parseError(data) }
    case 'cancelled':
      return { event: 'cancelled', data: parseCancelled(data) }
    case 'heartbeat':
      return { event: 'heartbeat', data }
  }
}
