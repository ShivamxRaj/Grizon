import { useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/api/errors'
import { downloadArtifact } from '../api/artifacts'
import { downloadFile } from '../api/files'
import { artifactMimeType } from '../lib/fileKinds'
import { previewOfficeBlob, type SpreadsheetPreview } from '../lib/filePreview'
import {
  officeFormatForKind,
  viewerKindForArtifact,
  viewerKindFromMimeAndName,
  type CanvasViewerKind,
} from '../lib/fileVisual'
import type { CanvasSelection } from '../types'

export interface CanvasBlobPreview {
  loading: boolean
  error: string | null
  kind: CanvasViewerKind
  objectUrl: string | null
  textLines: string[]
  docxParagraphs: string[]
  spreadsheet: SpreadsheetPreview | null
  textContent: string
  label: string
  downloadName: string
  mimeType: string | undefined
  blob: Blob | null
}

const EMPTY: CanvasBlobPreview = {
  loading: false,
  error: null,
  kind: 'binary',
  objectUrl: null,
  textLines: [],
  docxParagraphs: [],
  spreadsheet: null,
  textContent: '',
  label: '',
  downloadName: 'download',
  mimeType: undefined,
  blob: null,
}

function selectionMeta(selection: CanvasSelection): {
  id: string
  kind: 'file' | 'artifact'
  label: string
  mimeType?: string
  artifactType?: string
  downloadName: string
} {
  if (selection.origin === 'uploaded') {
    return {
      id: selection.attachment.id,
      kind: 'file',
      label: selection.attachment.name,
      mimeType: selection.attachment.mimeType,
      downloadName: selection.attachment.name,
    }
  }
  const { data } = selection.entry
  const artifactType = 'type' in data ? data.type : undefined
  const mimeType = 'mimeType' in data ? data.mimeType : undefined
  const downloadName =
    'filename' in data && data.filename
      ? data.filename
      : 'name' in data
        ? data.name
        : selection.entry.name
  return {
    id: selection.entry.id,
    kind: 'artifact',
    label: selection.entry.name,
    mimeType,
    artifactType,
    downloadName,
  }
}

function resolveViewerKind(
  meta: ReturnType<typeof selectionMeta>,
): CanvasViewerKind {
  if (meta.kind === 'artifact' && meta.artifactType) {
    return viewerKindForArtifact(meta.artifactType, meta.downloadName)
  }
  return viewerKindFromMimeAndName(meta.mimeType, meta.downloadName)
}

function resolveMime(meta: ReturnType<typeof selectionMeta>): string | undefined {
  const declared = meta.mimeType
  if (declared && declared !== 'application/octet-stream') return declared
  if (meta.kind === 'artifact' && meta.artifactType) {
    const derived = artifactMimeType(meta.artifactType)
    if (derived !== 'application/octet-stream') return derived
  }
  return declared
}

function withMimeType(blob: Blob, mime: string | undefined): Blob {
  if (!mime || blob.type === mime) return blob
  return new Blob([blob], { type: mime })
}

async function loadBlobForSelection(
  meta: ReturnType<typeof selectionMeta>,
): Promise<Blob> {
  if (meta.kind === 'file') return downloadFile(meta.id)
  return downloadArtifact(meta.id)
}

type PreviewBase = Omit<CanvasBlobPreview, 'loading' | 'error'>

function previewBase(
  meta: ReturnType<typeof selectionMeta>,
  kind: CanvasViewerKind,
  blob: Blob,
  mime: string | undefined,
): PreviewBase {
  return {
    kind,
    label: meta.label,
    downloadName: meta.downloadName,
    mimeType: mime,
    blob,
    objectUrl: null,
    textLines: [],
    docxParagraphs: [],
    spreadsheet: null,
    textContent: '',
  }
}

async function applyOfficePreview(
  base: PreviewBase,
  blob: Blob,
  fileName: string,
): Promise<PreviewBase> {
  const officeFormat = officeFormatForKind(base.kind, fileName)
  if (!officeFormat) return base
  const preview = await previewOfficeBlob(blob, officeFormat)
  if (preview.kind === 'docx') {
    return { ...base, docxParagraphs: preview.paragraphs, textContent: preview.paragraphs.join('\n') }
  }
  return { ...base, spreadsheet: preview.table }
}

async function buildPreviewState(
  meta: ReturnType<typeof selectionMeta>,
  rawBlob: Blob,
): Promise<PreviewBase> {
  const kind = resolveViewerKind(meta)
  const mime = resolveMime(meta)
  const blob = withMimeType(rawBlob, mime)
  const base = previewBase(meta, kind, blob, mime)

  if (kind === 'image' || kind === 'pdf' || kind === 'html') {
    return { ...base, objectUrl: URL.createObjectURL(blob) }
  }
  if (kind === 'code' || kind === 'json' || kind === 'readme') {
    const text = await blob.text()
    return { ...base, textContent: text, textLines: text.split('\n') }
  }
  return applyOfficePreview(base, blob, meta.downloadName)
}
export function useCanvasBlobPreview(selection: CanvasSelection | null): CanvasBlobPreview {
  const [state, setState] = useState<CanvasBlobPreview>(EMPTY)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    function revokePrevious(): void {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }

    if (!selection) {
      revokePrevious()
      setState(EMPTY)
      return
    }

    const meta = selectionMeta(selection)
    setState({ ...EMPTY, loading: true, label: meta.label, downloadName: meta.downloadName })

    void (async () => {
      try {
        const blob = await loadBlobForSelection(meta)
        if (cancelled) return
        const next = await buildPreviewState(meta, blob)
        if (cancelled) {
          if (next.objectUrl) URL.revokeObjectURL(next.objectUrl)
          return
        }
        revokePrevious()
        objectUrlRef.current = next.objectUrl
        setState({ ...next, loading: false, error: null })
      } catch (error) {
        if (cancelled) return
        revokePrevious()
        setState({
          ...EMPTY,
          loading: false,
          error: getApiErrorMessage(error, 'Failed to load preview'),
          label: meta.label,
          downloadName: meta.downloadName,
        })
      }
    })()

    return () => {
      cancelled = true
      revokePrevious()
    }
  }, [selection])

  return state
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function copyTextToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
