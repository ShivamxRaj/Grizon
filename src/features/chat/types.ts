import type { JSX, SVGProps } from 'react'
import type { Citation } from './api/types'

export interface Attachment {
  id: string
  name: string
  size: string
  mimeType?: string
  fileSize?: number
  processingStatus?: string
}

export type GeneratedFileKind = 'pdf' | 'doc' | 'sheet'

export interface GeneratedFile {
  id: string
  name: string
  kind: GeneratedFileKind
  meta: string
}

export type ArtifactKind = 'code' | 'markdown'

export interface MessageArtifact {
  id: string
  title: string
  kind: ArtifactKind
  language: string
  description: string
  content: string
  filename?: string
  mimeType?: string
  type?: string
  fileSize?: number | null
}

/** @deprecated Prefer MessageArtifact — kept for canvas preview helpers */
export type Artifact = MessageArtifact

export interface MetaChip {
  id: string
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  label: string
}

export interface UserMessage {
  id: string
  role: 'user'
  content: string
  attachments?: Attachment[]
}

export interface AssistantMessage {
  id: string
  role: 'assistant'
  content: string
  citations?: Citation[]
  artifacts?: MessageArtifact[]
  status?: 'pending' | 'streaming' | 'complete' | 'error'
  creditsDeducted?: number
  latencyMs?: number | null
  agentSlug?: string | null
  modelId?: string | null
  errorMessage?: string | null
  /** Legacy mock fields — avoided for live API messages */
  metaChips?: MetaChip[]
  file?: GeneratedFile
}

export type ChatMessage = UserMessage | AssistantMessage

export interface CanvasArtifactEntry {
  id: string
  name: string
  meta: string
  data: GeneratedFile | MessageArtifact
}

export type CanvasSelection =
  | { origin: 'uploaded'; attachment: Attachment }
  | { origin: 'artifact'; entry: CanvasArtifactEntry }

export type CanvasTab = 'viewer' | 'files'
