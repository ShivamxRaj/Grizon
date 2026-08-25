import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { getApiErrorMessage } from '@/lib/api/errors'
import {
  conversationArtifactsQueryKey,
  conversationFilesQueryKey,
  conversationQueryKey,
  conversationQueryOptions,
  driveArtifactsQueryKey,
} from '../api/query'
import { useCanvas } from '../hooks/useCanvas'
import { useChatStream } from '../hooks/useChatStream'
import { mapApiMessages } from '../lib/mapApiMessage'
import { clearPendingSend, markPendingSendStarted, peekPendingSend } from '../lib/pendingSend'
import { formatFileSize } from '../lib/formatFileSize'
import type { StreamState } from '../lib/streamReducer'
import type { ChatMessage, MessageArtifact, UserMessage } from '../types'
import type { ComposerSubmitPayload } from './composer/ChatComposer'
import { ConversationFooter } from './ConversationFooter'
import { ConversationThread } from './conversation/ConversationThread'
import { StreamingAssistantTurn } from './conversation/StreamingAssistantTurn'
import { TrustSecurityBanner } from './TrustSecurityBanner'
import { LegalSelectionToolbar } from './conversation/LegalSelectionToolbar'

function mergeMessages(history: ChatMessage[], pending: UserMessage | null): ChatMessage[] {
  if (!pending) return history
  const alreadyPresent = history.some(
    (message) => message.role === 'user' && message.content === pending.content,
  )
  if (alreadyPresent) return history
  return [...history, pending]
}

function useConversationMessages(chatId: string): {
  messages: ChatMessage[]
  pendingUser: UserMessage | null
  setPendingUser: (message: UserMessage | null) => void
  isLoading: boolean
  error: unknown
  isFetching: boolean
} {
  const query = useQuery(conversationQueryOptions(chatId))
  const [pendingUser, setPendingUser] = useState<UserMessage | null>(null)
  const history = useMemo(() => mapApiMessages(query.data?.messages ?? []), [query.data?.messages])
  const messages = useMemo(() => mergeMessages(history, pendingUser), [history, pendingUser])
  return {
    messages,
    pendingUser,
    setPendingUser,
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
  }
}

function isInlineChartArtifact(kind: string | undefined, inlineData: string | undefined): boolean {
  if (inlineData) return true
  const normalized = (kind ?? '').toLowerCase()
  return normalized === 'chart' || normalized === 'image'
}

function artifactFromStreamBlock(block: {
  artifactId: string
  title?: string
  kind?: string
  mimeType?: string
}): MessageArtifact {
  const type = block.kind ?? 'markdown'
  return {
    id: block.artifactId,
    title: block.title || 'Artifact',
    kind: type === 'markdown' || type === 'html' ? 'markdown' : 'code',
    language: type,
    description: block.title || type,
    content: '',
    filename: block.title,
    mimeType: block.mimeType,
    type,
  }
}

export function ConversationView(): JSX.Element {
  const { chatId } = useParams({ from: '/_workspace/chat/$chatId' })
  const queryClient = useQueryClient()
  const { messages, setPendingUser, isLoading, error, isFetching } = useConversationMessages(chatId)
  const { bindConversation, bumpFilesList, openSelection } = useCanvas()
  const openedArtifactIds = useRef(new Set<string>())

  useEffect(() => {
    bindConversation(chatId)
    openedArtifactIds.current.clear()
    return () => bindConversation(null)
  }, [chatId, bindConversation])

  const handleTerminal = useCallback(
    async (streamState: StreamState): Promise<void> => {
      if (streamState.phase !== 'completed') return
      clearPendingSend(chatId)
      bumpFilesList()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationQueryKey(chatId) }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
        queryClient.invalidateQueries({ queryKey: conversationFilesQueryKey(chatId) }),
        queryClient.invalidateQueries({ queryKey: conversationArtifactsQueryKey(chatId) }),
        queryClient.invalidateQueries({ queryKey: driveArtifactsQueryKey }),
      ])
      setPendingUser(null)
    },
    [bumpFilesList, chatId, queryClient, setPendingUser],
  )

  const stream = useChatStream(handleTerminal)
  const { reset: streamReset, send: streamSend, isStreaming, state: streamState } = stream

  useEffect(() => {
    for (const block of streamState.blocks) {
      if (block.type !== 'artifact') continue
      if (openedArtifactIds.current.has(block.artifactId)) continue
      openedArtifactIds.current.add(block.artifactId)
      bumpFilesList()
      if (isInlineChartArtifact(block.kind, block.inlineData)) continue
      const artifact = artifactFromStreamBlock(block)
      const sizeMeta =
        artifact.fileSize != null && artifact.fileSize > 0
          ? formatFileSize(artifact.fileSize)
          : artifact.description
      openSelection({
        origin: 'artifact',
        entry: {
          id: artifact.id,
          name: artifact.title,
          meta: sizeMeta,
          data: artifact,
        },
      })
    }
  }, [streamState.blocks, bumpFilesList, openSelection])

  const sendMessage = useCallback(
    async (
      content: string,
      options?: {
        clientMessageId?: string
        agentSlug?: string | null
        attachedFileIds?: string[]
        attachments?: UserMessage['attachments']
      },
    ): Promise<void> => {
      const trimmed = content.trim()
      const fileIds = options?.attachedFileIds ?? []
      if ((!trimmed && fileIds.length === 0) || isStreaming) return
      setPendingUser({
        id: `local-${options?.clientMessageId ?? crypto.randomUUID()}`,
        role: 'user',
        content: trimmed || ' ',
        attachments: options?.attachments,
      })
      await streamSend({
        conversationId: chatId,
        content: trimmed || ' ',
        clientMessageId: options?.clientMessageId,
        agentSlug: options?.agentSlug ?? null,
        attachedFileIds: fileIds,
      })
      bumpFilesList()
    },
    [bumpFilesList, chatId, isStreaming, setPendingUser, streamSend],
  )

  useEffect(() => {
    const pending = peekPendingSend(chatId)
    if (!pending || !markPendingSendStarted(chatId)) return
    void sendMessage(pending.content, {
      clientMessageId: pending.clientMessageId,
      agentSlug: pending.agentSlug,
      attachedFileIds: pending.attachedFileIds,
    })
  }, [chatId, sendMessage])

  useEffect(() => {
    if (streamState.phase === 'completed' && !isFetching) streamReset()
  }, [streamState.phase, isFetching, streamReset])

  const handleComposerSubmit = useCallback(
    (payload: ComposerSubmitPayload): void => {
      const ready = (payload.attachments ?? []).filter((item) => item.status === 'ready')
      void sendMessage(payload.message, {
        agentSlug: payload.agentSlug,
        attachedFileIds: ready.map((item) => item.id),
        attachments: ready.map((item) => ({
          id: item.id,
          name: item.name,
          size: item.size,
          mimeType: item.mimeType,
          fileSize: item.fileSize,
          processingStatus: 'ready',
        })),
      })
    },
    [sendMessage],
  )

  const showStream =
    isStreaming || streamState.phase === 'error' || streamState.phase === 'cancelled'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Top Legal Trust & Security Header Banner */}
      <TrustSecurityBanner />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && (
          <p className="px-lg pt-xl text-sm text-muted sm:px-5">Loading conversation…</p>
        )}
        {error ? (
          <p className="px-lg pt-xl text-sm text-danger-ink sm:px-5">
            {getApiErrorMessage(error, 'Failed to load conversation')}
          </p>
        ) : null}
        {!isLoading && !error && (
          <ConversationThread
            messages={messages}
            streamingSlot={showStream ? <StreamingAssistantTurn state={streamState} /> : undefined}
          />
        )}
      </div>

      <ConversationFooter
        onSubmit={handleComposerSubmit}
        disabled={isStreaming}
        conversationId={chatId}
      />

      {/* Floating Selection Legal Micro Toolbar */}
      <LegalSelectionToolbar />
    </div>
  )
}

