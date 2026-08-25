import { artifactExtension, specForArtifactType } from './fileKinds'

export type CanvasViewerKind =
  | 'code'
  | 'pdf'
  | 'json'
  | 'image'
  | 'readme'
  | 'html'
  | 'docx'
  | 'spreadsheet'
  | 'binary'

function extFromName(name: string): string {
  const parts = name.split('.')
  if (parts.length < 2) return ''
  return (parts.pop() ?? '').toLowerCase()
}

export function viewerKindFromMimeAndName(
  mimeType: string | undefined,
  fileName: string,
): CanvasViewerKind {
  const mime = (mimeType ?? '').toLowerCase()
  const ext = extFromName(fileName)

  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return 'image'
  }
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (mime.includes('json') || ext === 'json') return 'json'
  if (mime.includes('html') || ext === 'html' || ext === 'htm') return 'html'
  if (mime.includes('markdown') || ['md', 'markdown', 'txt'].includes(ext)) return 'readme'
  if (mime === 'text/csv' || mime.includes('spreadsheet') || ['xlsx', 'xls', 'csv'].includes(ext)) {
    return 'spreadsheet'
  }
  if (mime.includes('wordprocessingml') || mime.includes('msword') || ['docx', 'doc'].includes(ext)) {
    return 'docx'
  }
  if (isCodeExt(mime, ext)) return 'code'
  if (['pptx', 'ppt'].includes(ext) || mime.includes('presentation')) return 'binary'
  return 'binary'
}

function isCodeExt(mime: string, ext: string): boolean {
  if (mime.startsWith('text/')) return true
  return ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'c', 'cpp', 'css', 'xml', 'yaml', 'yml', 'sh', 'sql'].includes(
    ext,
  )
}

export function viewerKindForArtifact(artifactType: string, filename: string): CanvasViewerKind {
  const type = (artifactType || '').toLowerCase()
  const ext = (extFromName(filename) || artifactExtension(artifactType)).replace(/^\./, '')

  if (type === 'spreadsheet' || ['xlsx', 'xls'].includes(ext)) return 'spreadsheet'
  if (type === 'csv' || ext === 'csv') return 'spreadsheet'
  if (type === 'document' || ['docx', 'doc'].includes(ext)) return 'docx'
  if (type === 'pdf' || ext === 'pdf') return 'pdf'
  if (type === 'image' || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image'
  if (type === 'markdown' || ['md', 'txt'].includes(ext)) return 'readme'
  if (type === 'html' || ext === 'html') return 'html'
  if (type === 'chart') return 'image'
  if (type === 'code') return 'code'

  return viewerKindFromMimeAndName(specForArtifactType(type)?.mimeType, filename)
}

export function officeFormatForKind(
  kind: CanvasViewerKind,
  fileName: string,
): 'docx' | 'xlsx' | 'csv' | null {
  if (kind === 'docx') return 'docx'
  if (kind !== 'spreadsheet') return null
  const ext = extFromName(fileName)
  if (ext === 'csv') return 'csv'
  return 'xlsx'
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
