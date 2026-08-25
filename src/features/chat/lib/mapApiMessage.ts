import type { ApiMessage, ArtifactMeta, MessageFile } from '../api/types'
import type { Attachment, AssistantMessage, ChatMessage, MessageArtifact, UserMessage } from '../types'
import { formatFileSize } from './formatFileSize'

const GRIZON_TAG_PATTERN = /<\/?grizon-[a-z-]+\b[^>]*>/gi

export function stripGrizonTags(text: string): string {
  return text.replace(GRIZON_TAG_PATTERN, '').trim()
}

function mapAttachment(file: MessageFile): Attachment {
  return {
    id: file.id,
    name: file.fileName,
    size: formatFileSize(file.fileSize),
    mimeType: file.fileType,
    fileSize: file.fileSize,
    processingStatus: file.processingStatus,
  }
}

function mapArtifact(meta: ArtifactMeta): MessageArtifact {
  const kind = meta.type === 'markdown' || meta.type === 'html' ? 'markdown' : 'code'
  const sizeLabel =
    meta.fileSize != null && meta.fileSize > 0 ? formatFileSize(meta.fileSize) : null
  return {
    id: meta.id,
    title: meta.title || meta.filename,
    kind,
    language: meta.extension.replace(/^\./, '') || meta.type,
    description: sizeLabel ? `${meta.filename} · ${sizeLabel}` : meta.filename,
    content: '',
    filename: meta.filename,
    mimeType: meta.mimeType,
    type: meta.type,
    fileSize: meta.fileSize ?? null,
  }
}

export function mapApiMessage(message: ApiMessage): ChatMessage | null {
  if (message.role === 'system') return null
  if (message.role === 'user') {
    const user: UserMessage = {
      id: message.id,
      role: 'user',
      content: message.content,
      attachments: (message.attachedFiles ?? []).map(mapAttachment),
    }
    return user
  }
  if (message.status === 'streaming' && !message.content.trim()) return null
  const assistant: AssistantMessage = {
    id: message.id,
    role: 'assistant',
    content: stripGrizonTags(message.content),
    citations: message.citations,
    artifacts: (message.artifacts ?? []).map(mapArtifact),
    status: message.status,
    creditsDeducted: message.creditsDeducted,
    latencyMs: message.latencyMs,
    agentSlug: message.agentSlug,
    modelId: message.modelId,
    errorMessage: message.errorMessage,
  }
  return assistant
}

export function mapApiMessages(messages: ApiMessage[]): ChatMessage[] {
  return messages
    .map(mapApiMessage)
    .filter((message): message is ChatMessage => message !== null)
}
