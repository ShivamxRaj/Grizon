import { apiFetch, apiFetchBlob, apiFetchNoContent } from '@/lib/api/client'
import {
  parseConversationFilesResult,
  parseFileStatusResult,
  parseUploadFileResult,
} from './fileGuards'
import type { StoredFile, UploadFileInput, UploadFileResult } from './types'

const FILES_BASE = '/api/v1/files'
const CONV_BASE = '/api/v1/conversations'

function limitQuery(limit?: number): string {
  if (limit === undefined) return ''
  return `?limit=${encodeURIComponent(String(limit))}`
}

export function uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
  return apiFetch(`${FILES_BASE}/upload`, { auth: true, body: input }, parseUploadFileResult)
}

export function getFileStatus(fileId: string): Promise<UploadFileResult> {
  return apiFetch(
    `${FILES_BASE}/${encodeURIComponent(fileId)}`,
    { auth: true, method: 'GET' },
    parseFileStatusResult,
  )
}

export function deleteFile(fileId: string): Promise<void> {
  return apiFetchNoContent(`${FILES_BASE}/${encodeURIComponent(fileId)}`, {
    auth: true,
    method: 'DELETE',
  })
}

export function downloadFile(fileId: string): Promise<Blob> {
  return apiFetchBlob(`${FILES_BASE}/${encodeURIComponent(fileId)}/download`)
}

export async function listConversationFiles(
  conversationId: string,
  opts?: { limit?: number },
): Promise<{ files: StoredFile[] }> {
  return apiFetch(
    `${CONV_BASE}/${encodeURIComponent(conversationId)}/files${limitQuery(opts?.limit ?? 100)}`,
    { auth: true, method: 'GET' },
    parseConversationFilesResult,
  )
}
