import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type JSX, type ReactNode } from 'react'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { ArtifactDetail, StoredFile } from '../api/types'
import {
  conversationArtifactsQueryKey,
  conversationArtifactsQueryOptions,
  conversationFilesQueryKey,
  conversationFilesQueryOptions,
} from '../api/query'
import { artifactDisplayFilename } from '../lib/fileKinds'
import { formatBytes } from '../lib/fileVisual'
import { formatFileSize } from '../lib/formatFileSize'
import type {
  Attachment,
  CanvasArtifactEntry,
  CanvasSelection,
  CanvasTab,
  MessageArtifact,
} from '../types'
import {
  CANVAS_DEFAULT_WIDTH,
  CanvasContext,
  type CanvasContextValue,
  type CanvasSources,
} from './canvasContext'

function mapStoredFile(file: StoredFile): Attachment {
  return {
    id: file.id,
    name: file.fileName,
    size: formatFileSize(file.fileSize),
    mimeType: file.fileType,
    fileSize: file.fileSize,
    processingStatus: file.processingStatus,
  }
}

function mapArtifactEntry(artifact: ArtifactDetail): CanvasArtifactEntry {
  const filename = artifactDisplayFilename(artifact.title, artifact.type)
  const sizeLabel =
    artifact.fileSize != null && artifact.fileSize > 0 ? formatBytes(artifact.fileSize) : null
  const data: MessageArtifact = {
    id: artifact.id,
    title: artifact.title,
    kind: artifact.type === 'markdown' || artifact.type === 'html' ? 'markdown' : 'code',
    language: artifact.type,
    description: sizeLabel ? `${filename} · ${sizeLabel}` : filename,
    content: artifact.contentText ?? '',
    filename,
    mimeType: artifact.mimeType,
    type: artifact.type,
    fileSize: artifact.fileSize,
  }
  return {
    id: artifact.id,
    name: artifact.title,
    meta: sizeLabel ?? artifact.type,
    data,
  }
}

export function CanvasProvider({ children }: { children: ReactNode }): JSX.Element {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<CanvasTab>('files')
  const [width, setWidth] = useState(CANVAS_DEFAULT_WIDTH)
  const [selection, setSelection] = useState<CanvasSelection | null>(null)
  const [override, setOverride] = useState<CanvasSources | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [filesListVersion, setFilesListVersion] = useState(0)

  const filesQuery = useQuery({
    ...conversationFilesQueryOptions(activeConversationId ?? ''),
    enabled: Boolean(activeConversationId) && !override,
  })
  const artifactsQuery = useQuery({
    ...conversationArtifactsQueryOptions(activeConversationId ?? ''),
    enabled: Boolean(activeConversationId) && !override,
  })

  const apiUploads = useMemo(() => (filesQuery.data ?? []).map(mapStoredFile), [filesQuery.data])
  const apiArtifacts = useMemo(
    () => (artifactsQuery.data ?? []).map(mapArtifactEntry),
    [artifactsQuery.data],
  )

  const setSources = useCallback((next: CanvasSources | null) => {
    setOverride(next)
    setSelection(null)
    setTab('files')
  }, [])

  const bindConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId)
    setSelection(null)
    if (!conversationId) setOverride(null)
  }, [])

  const bumpFilesList = useCallback(() => {
    setFilesListVersion((v) => v + 1)
    if (!activeConversationId) return
    void queryClient.invalidateQueries({ queryKey: conversationFilesQueryKey(activeConversationId) })
    void queryClient.invalidateQueries({
      queryKey: conversationArtifactsQueryKey(activeConversationId),
    })
  }, [activeConversationId, queryClient])

  const openSelection = useCallback((next: CanvasSelection) => {
    setSelection(next)
    setTab('viewer')
    setIsOpen(true)
  }, [])

  const openFilesTab = useCallback(() => {
    setTab('files')
    setIsOpen(true)
  }, [])

  const listLoading =
    Boolean(activeConversationId) && !override && (filesQuery.isLoading || artifactsQuery.isLoading)
  const listErrorRaw = !override ? (filesQuery.error ?? artifactsQuery.error) : null
  const listError = listErrorRaw ? getApiErrorMessage(listErrorRaw, 'Failed to load files') : null

  const value: CanvasContextValue = {
    isOpen,
    tab,
    width,
    selection,
    uploadedFiles: override?.uploaded ?? apiUploads,
    artifacts: override?.artifacts ?? apiArtifacts,
    activeConversationId,
    filesListVersion,
    listLoading,
    listError,
    setTab,
    setWidth,
    setSources,
    bindConversation,
    bumpFilesList,
    openSelection,
    openFilesTab,
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  }

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
}
