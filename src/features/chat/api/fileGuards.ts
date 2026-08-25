import { isBoolean, isNumber, isRecord, isString } from '@/lib/api/guards'
import { ApiError } from '@/lib/api/errors'
import type { ArtifactDetail, FileProcessingStatus, MessageFile, StoredFile, UploadFileResult } from './types'

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new ApiError(500, 'INVALID_RESPONSE', `Expected ${label} object`)
  return value
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value)
}

const FILE_STATUSES: ReadonlySet<string> = new Set(['pending', 'processing', 'ready', 'failed'])

function parseProcessingStatus(value: unknown): FileProcessingStatus {
  if (isString(value) && FILE_STATUSES.has(value)) return value as FileProcessingStatus
  return 'pending'
}

export function parseStoredFile(value: unknown): StoredFile {
  const row = requireRecord(value, 'file')
  if (!isString(row.id) || !isString(row.fileName) || !isString(row.fileType)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'File missing required fields')
  }
  if (!isNumber(row.fileSize) || !isString(row.uploadedAt)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'File missing size or uploadedAt')
  }
  return {
    id: row.id,
    userId: isString(row.userId) ? row.userId : '',
    conversationId: isNullableString(row.conversationId) ? row.conversationId : null,
    messageId: isNullableString(row.messageId) ? row.messageId : null,
    fileName: row.fileName,
    fileType: row.fileType,
    fileSize: row.fileSize,
    storagePath: isString(row.storagePath) ? row.storagePath : '',
    processingStatus: parseProcessingStatus(row.processingStatus),
    extractedText: isNullableString(row.extractedText) ? row.extractedText : null,
    vectorised: isBoolean(row.vectorised) ? row.vectorised : false,
    errorMessage: isNullableString(row.errorMessage) ? row.errorMessage : null,
    uploadedAt: row.uploadedAt,
  }
}

export function parseUploadFileResult(value: unknown): UploadFileResult {
  const row = requireRecord(value, 'upload result')
  return { file: parseStoredFile(row.file) }
}

export function parseFileStatusResult(value: unknown): UploadFileResult {
  return parseUploadFileResult(value)
}

export function parseConversationFilesResult(value: unknown): { files: StoredFile[] } {
  const row = requireRecord(value, 'conversation files')
  const raw = Array.isArray(row.files) ? row.files : []
  return { files: raw.map(parseStoredFile) }
}

export function toMessageFile(file: StoredFile): MessageFile {
  return {
    id: file.id,
    fileName: file.fileName,
    fileType: file.fileType,
    fileSize: file.fileSize,
    processingStatus: file.processingStatus,
    uploadedAt: file.uploadedAt,
  }
}

export function parseArtifactDetail(value: unknown): ArtifactDetail {
  const row = requireRecord(value, 'artifact')
  if (!isString(row.id) || !isString(row.title) || !isString(row.type)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Artifact missing required fields')
  }
  if (!isString(row.conversationId) || !isNumber(row.versionNumber) || !isString(row.createdAt)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Artifact missing conversation or version fields')
  }
  return {
    id: row.id,
    userId: isString(row.userId) ? row.userId : '',
    conversationId: row.conversationId,
    messageId: isNullableString(row.messageId) ? row.messageId : null,
    title: row.title,
    type: row.type,
    parentId: isNullableString(row.parentId) ? row.parentId : null,
    versionNumber: row.versionNumber,
    contentHash: isNullableString(row.contentHash) ? row.contentHash : null,
    storagePath: isNullableString(row.storagePath) ? row.storagePath : null,
    contentText: isNullableString(row.contentText) ? row.contentText : null,
    createdByAgent: isString(row.createdByAgent) ? row.createdByAgent : '',
    isLatest: isBoolean(row.isLatest) ? row.isLatest : true,
    previewHtml: isNullableString(row.previewHtml) ? row.previewHtml : undefined,
    previewGeneratedAt: isNullableString(row.previewGeneratedAt) ? row.previewGeneratedAt : undefined,
    fileSize: isNumber(row.fileSize) ? row.fileSize : row.fileSize === null ? null : null,
    createdAt: row.createdAt,
    filename: isString(row.filename) ? row.filename : undefined,
    extension: isString(row.extension) ? row.extension : undefined,
    mimeType: isString(row.mimeType) ? row.mimeType : undefined,
  }
}

export function parseArtifactResult(value: unknown): { artifact: ArtifactDetail } {
  const row = requireRecord(value, 'artifact result')
  return { artifact: parseArtifactDetail(row.artifact) }
}

export function parseArtifactsListResult(value: unknown): { artifacts: ArtifactDetail[] } {
  const row = requireRecord(value, 'artifacts list')
  const raw = Array.isArray(row.artifacts) ? row.artifacts : []
  return { artifacts: raw.map(parseArtifactDetail) }
}
