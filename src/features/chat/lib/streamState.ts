export type StreamPhase =
  | 'idle'
  | 'queued'
  | 'processing'
  | 'streaming'
  | 'completed'
  | 'error'
  | 'cancelled'

export type StreamBlock =
  | { type: 'phase'; id: string; label: string }
  | { type: 'status'; id: string; text: string }
  | {
      type: 'tool'
      callId: string
      toolId: string
      phase: 'running' | 'done'
      argsSummary?: string
      resultSummary?: string
      durationMs?: number
    }
  | { type: 'markdown'; id: string; content: string }
  | {
      type: 'artifact'
      artifactId: string
      title?: string
      kind?: string
      inlineData?: string
      mimeType?: string
    }

export interface StreamMeta {
  agentSlug?: string | null
  modelId?: string | null
  modelProvider?: string | null
  creditsDeducted?: number
  messageId?: string
  conversationId?: string
  durationMs?: number
}

export interface StreamState {
  phase: StreamPhase
  blocks: StreamBlock[]
  meta: StreamMeta
  error?: { code?: string; message: string }
}

export const INITIAL_STREAM_STATE: StreamState = {
  phase: 'idle',
  blocks: [],
  meta: {},
}

let blockSeq = 0

export function nextBlockId(prefix: string): string {
  blockSeq += 1
  return `${prefix}-${blockSeq}`
}

export function summarizeArgs(args: unknown): string | undefined {
  if (!args || typeof args !== 'object') return undefined
  const record = args as Record<string, unknown>
  const value = record.query ?? record.reason ?? record.url ?? record.path
  if (typeof value !== 'string' || !value.trim()) return undefined
  return value.length > 120 ? `${value.slice(0, 117)}…` : value
}

export function summarizeOutput(output: unknown, fallback?: string): string {
  if (fallback) return fallback
  if (!output || typeof output !== 'object') return 'Done'
  const record = output as Record<string, unknown>
  if (Array.isArray(record.results)) return `${record.results.length} result(s)`
  if (typeof record.summary === 'string') return record.summary
  if (typeof record.message === 'string') return record.message
  return 'Done'
}

export function upsertPhase(blocks: StreamBlock[], label: string): StreamBlock[] {
  const last = blocks[blocks.length - 1]
  if (last?.type === 'phase') return [...blocks.slice(0, -1), { ...last, label }]
  return [...blocks, { type: 'phase', id: nextBlockId('phase'), label }]
}

export function appendStatus(blocks: StreamBlock[], text: string): StreamBlock[] {
  const last = blocks[blocks.length - 1]
  if (last?.type === 'status') {
    return [...blocks.slice(0, -1), { ...last, text: `${last.text}${text}` }]
  }
  return [...blocks, { type: 'status', id: nextBlockId('status'), text }]
}

export function appendMarkdown(blocks: StreamBlock[], content: string): StreamBlock[] {
  const last = blocks[blocks.length - 1]
  if (last?.type === 'markdown') {
    return [...blocks.slice(0, -1), { ...last, content: `${last.content}${content}` }]
  }
  return [...blocks, { type: 'markdown', id: nextBlockId('md'), content }]
}

export function markdownFromBlocks(blocks: StreamBlock[]): string {
  return blocks
    .filter((block): block is Extract<StreamBlock, { type: 'markdown' }> => block.type === 'markdown')
    .map((block) => block.content)
    .join('')
}
