import { apiFetch } from '@/lib/api/client'
import { parseEnqueueChatResult } from './guards'
import type { EnqueueChatInput, EnqueueChatResult } from './types'

const BASE = '/api/v1/chat'

export function enqueueChat(input: EnqueueChatInput): Promise<EnqueueChatResult> {
  return apiFetch(
    BASE,
    {
      auth: true,
      body: {
        conversationId: input.conversationId,
        clientMessageId: input.clientMessageId,
        content: input.content,
        attachedFileIds: input.attachedFileIds ?? [],
        agentSlug: input.agentSlug ?? null,
      },
    },
    parseEnqueueChatResult,
  )
}

export function cancelChat(conversationId: string): Promise<void> {
  return apiFetch(
    `${BASE}/${encodeURIComponent(conversationId)}/cancel`,
    { auth: true, method: 'POST', body: {} },
    () => undefined,
  )
}
