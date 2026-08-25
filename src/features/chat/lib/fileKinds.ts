/**
 * Frontend mirror of backend artifact type → filename/MIME helpers.
 */

export type CanonicalKind = 'excel' | 'docx' | 'markdown' | 'pdf' | 'txt' | 'csv'

export type ArtifactDbType = 'spreadsheet' | 'document' | 'pdf' | 'markdown' | 'csv'

export interface FileKindSpec {
  canonicalKind: CanonicalKind
  artifactType: ArtifactDbType
  extension: string
  mimeType: string
}

function normalizeExtension(extension?: string | null): string {
  const value = (extension ?? '').trim().toLowerCase()
  if (!value) return ''
  return value.startsWith('.') ? value : `.${value}`
}

const SPECS: Record<CanonicalKind, FileKindSpec> = {
  excel: {
    canonicalKind: 'excel',
    artifactType: 'spreadsheet',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  docx: {
    canonicalKind: 'docx',
    artifactType: 'document',
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  pdf: {
    canonicalKind: 'pdf',
    artifactType: 'pdf',
    extension: '.pdf',
    mimeType: 'application/pdf',
  },
  markdown: {
    canonicalKind: 'markdown',
    artifactType: 'markdown',
    extension: '.md',
    mimeType: 'text/markdown; charset=utf-8',
  },
  txt: {
    canonicalKind: 'txt',
    artifactType: 'markdown',
    extension: '.txt',
    mimeType: 'text/plain; charset=utf-8',
  },
  csv: {
    canonicalKind: 'csv',
    artifactType: 'csv',
    extension: '.csv',
    mimeType: 'text/csv; charset=utf-8',
  },
}

export function specForArtifactType(artifactType: string): FileKindSpec | null {
  switch (artifactType) {
    case 'spreadsheet':
      return SPECS.excel
    case 'document':
      return SPECS.docx
    case 'pdf':
      return SPECS.pdf
    case 'markdown':
      return SPECS.markdown
    case 'csv':
      return SPECS.csv
    default:
      return null
  }
}

function sanitizeTitle(title: string, maxLength = 120): string {
  const cleaned = title
    .replace(/[^a-zA-Z0-9_\-. ]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.slice(0, maxLength)
}

function buildFilename(title: string, spec: FileKindSpec): string {
  const ext = spec.extension
  if (title.toLowerCase().endsWith(ext)) return title
  return `${title}${ext}`
}

export function artifactDisplayFilename(
  title: string,
  artifactType: string,
  extension?: string | null,
): string {
  const safeBase = sanitizeTitle(title) || 'file'
  const spec = specForArtifactType(artifactType)
  if (spec) return buildFilename(safeBase, spec)
  const normalizedExt = normalizeExtension(extension)
  if (artifactType === 'image') return normalizedExt ? `${safeBase}${normalizedExt}` : `${safeBase}.png`
  if (artifactType === 'html') return `${safeBase}.html`
  return safeBase
}

export function artifactMimeType(artifactType: string, extension?: string | null): string {
  const spec = specForArtifactType(artifactType)
  if (spec) return spec.mimeType
  if (artifactType === 'image') {
    const normalizedExt = normalizeExtension(extension)
    if (normalizedExt === '.svg') return 'image/svg+xml'
    return 'image/png'
  }
  if (artifactType === 'html') return 'text/html; charset=utf-8'
  return 'application/octet-stream'
}

export function artifactExtension(artifactType: string, extension?: string | null): string {
  const spec = specForArtifactType(artifactType)
  if (spec) return spec.extension
  const normalizedExt = normalizeExtension(extension)
  if (artifactType === 'image') return normalizedExt || '.png'
  if (artifactType === 'html') return '.html'
  return normalizedExt
}
