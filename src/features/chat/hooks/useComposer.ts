import { useCallback, useMemo, useState, type RefObject } from 'react'
import type { ComposerAttachment } from '../components/composer/types'
import { formatFileSize } from '../lib/formatFileSize'
import { useAutoGrowTextarea } from './useAutoGrowTextarea'
import { useFileUpload } from './useFileUpload'

export interface ComposerController {
  value: string
  setValue: (value: string) => void
  attachments: ComposerAttachment[]
  addFiles: (files: FileList | File[]) => void
  removeAttachment: (id: string) => void
  submit: () => void
  canSubmit: boolean
  textareaRef: RefObject<HTMLTextAreaElement | null>
  /** True once the text spans 2+ lines — drives the pill → card layout switch. */
  multiline: boolean
}

type SubmitHandler = (message: string, attachments: ComposerAttachment[]) => void

function toAttachment(file: File): ComposerAttachment {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: formatFileSize(file.size),
    mimeType: file.type || undefined,
    fileSize: file.size,
    status: 'uploading',
    progress: 0,
    file,
  }
}

export function useComposer(
  onSubmit?: SubmitHandler,
  conversationId: string | null = null,
): ComposerController {
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([])
  const { ref: textareaRef, multiline } = useAutoGrowTextarea(value)
  const { start, cancel } = useFileUpload(setAttachments, conversationId)

  const addFiles = useCallback(
    (files: FileList | File[]): void => {
      const incoming = Array.from(files).map((file) => ({
        meta: toAttachment(file),
        file,
      }))
      if (incoming.length === 0) return
      setAttachments((prev) => [...prev, ...incoming.map((item) => item.meta)])
      incoming.forEach((item) => start(item.meta.id, item.file))
    },
    [start],
  )

  const removeAttachment = useCallback(
    (id: string): void => {
      cancel(id)
      setAttachments((prev) => prev.filter((item) => item.id !== id))
    },
    [cancel],
  )

  const isUploading = useMemo(
    () => attachments.some((item) => item.status === 'uploading'),
    [attachments],
  )
  const readyAttachments = useMemo(
    () => attachments.filter((item) => item.status === 'ready'),
    [attachments],
  )
  const canSubmit = !isUploading && (value.trim().length > 0 || readyAttachments.length > 0)

  const submit = useCallback((): void => {
    if (!canSubmit) return
    onSubmit?.(value.trim(), readyAttachments)
    setValue('')
    setAttachments([])
  }, [canSubmit, onSubmit, value, readyAttachments])

  return {
    value,
    setValue,
    attachments,
    addFiles,
    removeAttachment,
    submit,
    canSubmit,
    textareaRef,
    multiline,
  }
}
