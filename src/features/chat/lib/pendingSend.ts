/** One-shot handoff from empty-chat create → conversation view auto-send. */

export interface PendingSend {
  content: string
  clientMessageId: string
  agentSlug: string | null
  attachedFileIds: string[]
}

function payloadKey(conversationId: string): string {
  return `grizon:pending-send:${conversationId}`
}

function startedKey(conversationId: string): string {
  return `grizon:pending-send-started:${conversationId}`
}

export function setPendingSend(
  conversationId: string,
  content: string,
  agentSlug: string | null = null,
  attachedFileIds: string[] = [],
): void {
  const payload: PendingSend = {
    content,
    clientMessageId: crypto.randomUUID(),
    agentSlug,
    attachedFileIds,
  }
  sessionStorage.setItem(payloadKey(conversationId), JSON.stringify(payload))
  sessionStorage.removeItem(startedKey(conversationId))
}

function parsePendingSend(raw: string): PendingSend | null {
  try {
    const parsed = JSON.parse(raw) as PendingSend
    if (typeof parsed.content !== 'string' || typeof parsed.clientMessageId !== 'string') {
      return null
    }
    return {
      content: parsed.content,
      clientMessageId: parsed.clientMessageId,
      agentSlug: typeof parsed.agentSlug === 'string' ? parsed.agentSlug : null,
      attachedFileIds: Array.isArray(parsed.attachedFileIds)
        ? parsed.attachedFileIds.filter((id): id is string => typeof id === 'string')
        : [],
    }
  } catch {
    return null
  }
}

export function peekPendingSend(conversationId: string): PendingSend | null {
  const raw = sessionStorage.getItem(payloadKey(conversationId))
  if (!raw) return null
  return parsePendingSend(raw)
}

export function markPendingSendStarted(conversationId: string): boolean {
  if (sessionStorage.getItem(startedKey(conversationId))) return false
  sessionStorage.setItem(startedKey(conversationId), '1')
  return true
}

export function clearPendingSend(conversationId: string): void {
  sessionStorage.removeItem(payloadKey(conversationId))
  sessionStorage.removeItem(startedKey(conversationId))
}
