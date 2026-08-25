import type { Attachment } from '../../types'

/** Upload lifecycle for a chip. Kept local to the composer so the shared
 * `Attachment` type (used by rendered conversation turns) stays lean. */
export type AttachmentStatus = 'uploading' | 'ready' | 'error'

export interface ComposerAttachment extends Attachment {
  status: AttachmentStatus
  /** 0–100, only meaningful while status is 'uploading'. */
  progress: number
  /** Short reason shown in the error state (e.g. "Too large"). */
  errorLabel?: string
  /** Local File retained until server upload (empty-chat path). */
  file?: File
}
