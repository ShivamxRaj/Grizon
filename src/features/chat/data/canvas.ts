import type { Attachment, CanvasArtifactEntry, ChatMessage } from '../types'

export function getFileExtensionLabel(name: string): string {
  const extension = name.split('.').pop()
  return extension ? extension.toUpperCase() : 'FILE'
}

export function getUploadedFiles(messages: ChatMessage[] = []): Attachment[] {
  return messages
    .filter((message): message is Extract<ChatMessage, { role: 'user' }> => message.role === 'user')
    .flatMap((message) => message.attachments ?? [])
}

export function getCanvasArtifacts(messages: ChatMessage[] = []): CanvasArtifactEntry[] {
  return messages
    .filter((message): message is Extract<ChatMessage, { role: 'assistant' }> => message.role === 'assistant')
    .flatMap((message) =>
      (message.artifacts ?? []).map((artifact) => ({
        id: artifact.id,
        name: artifact.title,
        meta: artifact.description,
        data: artifact,
      })),
    )
}
