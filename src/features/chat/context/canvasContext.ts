import { createContext } from 'react'
import type { Attachment, CanvasArtifactEntry, CanvasSelection, CanvasTab } from '../types'

export interface CanvasSources {
  uploaded: Attachment[]
  artifacts: CanvasArtifactEntry[]
}

export const CANVAS_DEFAULT_WIDTH = 460
export const CANVAS_MIN_WIDTH = 360
export const CANVAS_MAX_WIDTH = 720

export interface CanvasContextValue {
  isOpen: boolean
  tab: CanvasTab
  width: number
  selection: CanvasSelection | null
  uploadedFiles: Attachment[]
  artifacts: CanvasArtifactEntry[]
  activeConversationId: string | null
  filesListVersion: number
  listLoading: boolean
  listError: string | null
  setTab: (tab: CanvasTab) => void
  setWidth: (width: number) => void
  openSelection: (selection: CanvasSelection) => void
  openFilesTab: () => void
  /** Override canvas sources (e.g. project detail); null restores conversation API lists. */
  setSources: (sources: CanvasSources | null) => void
  bindConversation: (conversationId: string | null) => void
  bumpFilesList: () => void
  close: () => void
  toggle: () => void
}

export const CanvasContext = createContext<CanvasContextValue | null>(null)
