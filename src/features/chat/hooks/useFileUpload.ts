import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { getApiErrorMessage } from '@/lib/api/errors'
import { getFileStatus, uploadFile } from '../api/files'
import type { StoredFile } from '../api/types'
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  FILE_POLL_INTERVAL_MS,
  FILE_POLL_MAX_ATTEMPTS,
  MAX_FILE_BYTES,
} from '../components/composer/constants'
import type { ComposerAttachment } from '../components/composer/types'

type SetAttachments = Dispatch<SetStateAction<ComposerAttachment[]>>

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file as base64'))
        return
      }
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function resolveMimeType(file: File): string {
  if (file.type && ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) return file.type
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return 'application/pdf'
  if (name.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (name.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  if (name.endsWith('.csv')) return 'text/csv'
  if (name.endsWith('.txt')) return 'text/plain'
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  return file.type || 'application/octet-stream'
}

async function pollUntilReady(fileId: string): Promise<StoredFile> {
  for (let attempt = 0; attempt < FILE_POLL_MAX_ATTEMPTS; attempt++) {
    const { file } = await getFileStatus(fileId)
    if (file.processingStatus === 'ready') return file
    if (file.processingStatus === 'failed') {
      throw new Error(file.errorMessage || 'File processing failed')
    }
    await new Promise((resolve) => setTimeout(resolve, FILE_POLL_INTERVAL_MS))
  }
  throw new Error('Timed out waiting for file processing')
}

function patchAttachment(
  list: ComposerAttachment[],
  localId: string,
  patch: Partial<ComposerAttachment>,
): ComposerAttachment[] {
  return list.map((item) => (item.id === localId ? { ...item, ...patch } : item))
}

function markError(
  setAttachments: SetAttachments,
  localId: string,
  errorLabel: string,
): void {
  setAttachments((prev) =>
    patchAttachment(prev, localId, { status: 'error', progress: 100, errorLabel }),
  )
}

function markLocalReady(
  setAttachments: SetAttachments,
  localId: string,
  file: File,
  mimeType: string,
): void {
  setAttachments((prev) =>
    patchAttachment(prev, localId, {
      status: 'ready',
      progress: 100,
      mimeType,
      fileSize: file.size,
      file,
    }),
  )
}

function markServerReady(
  setAttachments: SetAttachments,
  localId: string,
  ready: StoredFile,
): void {
  setAttachments((prev) =>
    patchAttachment(prev, localId, {
      id: ready.id,
      status: 'ready',
      progress: 100,
      mimeType: ready.fileType,
      fileSize: ready.fileSize,
      processingStatus: ready.processingStatus,
      file: undefined,
    }),
  )
}

function validateUploadFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return 'Too large'
  const mimeType = resolveMimeType(file)
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(mimeType)) return 'Type not allowed'
  return null
}

async function uploadAndPoll(
  file: File,
  conversationId: string,
  mimeType: string,
  onProgress: (progress: number) => void,
  signal: AbortSignal,
): Promise<StoredFile> {
  onProgress(20)
  const contentBase64 = await readFileAsBase64(file)
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
  onProgress(55)
  const uploaded = await uploadFile({
    conversationId,
    fileName: file.name,
    fileType: mimeType,
    fileSize: file.size,
    contentBase64,
  })
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
  onProgress(80)
  return pollUntilReady(uploaded.file.id)
}

async function runUploadJob(
  localId: string,
  file: File,
  conversationId: string | null,
  setAttachments: SetAttachments,
  signal: AbortSignal,
): Promise<void> {
  const validationError = validateUploadFile(file)
  if (validationError) {
    markError(setAttachments, localId, validationError)
    return
  }
  const mimeType = resolveMimeType(file)
  if (!conversationId) {
    markLocalReady(setAttachments, localId, file, mimeType)
    return
  }
  const ready = await uploadAndPoll(
    file,
    conversationId,
    mimeType,
    (progress) => {
      setAttachments((prev) => patchAttachment(prev, localId, { progress, mimeType }))
    },
    signal,
  )
  if (signal.aborted) return
  markServerReady(setAttachments, localId, ready)
}

export function useFileUpload(
  setAttachments: SetAttachments,
  conversationId: string | null,
): {
  start: (localId: string, file: File) => void
  cancel: (localId: string) => void
} {
  const abortRef = useRef(new Map<string, AbortController>())
  const conversationRef = useRef(conversationId)
  conversationRef.current = conversationId

  const cancel = useCallback((localId: string): void => {
    abortRef.current.get(localId)?.abort()
    abortRef.current.delete(localId)
  }, [])

  const start = useCallback(
    (localId: string, file: File): void => {
      cancel(localId)
      const controller = new AbortController()
      abortRef.current.set(localId, controller)
      void (async () => {
        try {
          await runUploadJob(localId, file, conversationRef.current, setAttachments, controller.signal)
        } catch (error) {
          if (controller.signal.aborted) return
          markError(setAttachments, localId, getApiErrorMessage(error, 'Upload failed'))
        } finally {
          abortRef.current.delete(localId)
        }
      })()
    },
    [cancel, setAttachments],
  )

  useEffect(() => {
    const map = abortRef.current
    return () => {
      map.forEach((controller) => controller.abort())
      map.clear()
    }
  }, [])

  return { start, cancel }
}

/** Upload a local File after conversation creation (empty-chat flow). */
export async function uploadLocalFile(file: File, conversationId: string): Promise<StoredFile> {
  const validationError = validateUploadFile(file)
  if (validationError) throw new Error(validationError)
  const mimeType = resolveMimeType(file)
  return uploadAndPoll(file, conversationId, mimeType, () => undefined, new AbortController().signal)
}
