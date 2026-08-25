import { useEffect, useState, type JSX } from 'react'
import { downloadArtifact, getArtifactById } from '../../api/artifacts'
import {
  artifactIdFromImageSrc,
  getCachedArtifactImage,
  setCachedArtifactImage,
  svgToDataUrl,
  type InlineArtifactMap,
} from './markdownUtils'

interface InlineArtifactImageProps {
  artifactId?: string
  src?: string
  alt?: string
  streamArtifact?: InlineArtifactMap[string]
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read artifact blob'))
    reader.readAsDataURL(blob)
  })
}

function dataUrlFromContentText(contentText: string, mimeType: string): string {
  const trimmed = contentText.trim()
  const isSvg = mimeType.includes('svg') || trimmed.startsWith('<svg')
  if (isSvg) return svgToDataUrl(trimmed, false)
  const bytes = new TextEncoder().encode(trimmed)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:${mimeType};base64,${btoa(binary)}`
}

async function fetchHistoricalImage(
  artifactId: string,
): Promise<{ dataUrl: string; mimeType: string } | null> {
  const { artifact } = await getArtifactById(artifactId)
  const mimeType = artifact.mimeType?.trim() || 'image/svg+xml'

  if (artifact.contentText?.trim()) {
    return { dataUrl: dataUrlFromContentText(artifact.contentText, mimeType), mimeType }
  }

  const blob = await downloadArtifact(artifactId)
  const typedBlob =
    mimeType && blob.type !== mimeType ? new Blob([blob], { type: mimeType }) : blob
  const dataUrl = await blobToDataUrl(typedBlob)
  return { dataUrl, mimeType: typedBlob.type || mimeType }
}

async function resolveHistoricalArtifactImage(
  artifactId: string,
): Promise<{ dataUrl: string; mimeType: string } | null> {
  const cached = getCachedArtifactImage(artifactId)
  if (cached) return 'error' in cached ? null : cached

  try {
    const entry = await fetchHistoricalImage(artifactId)
    if (!entry) {
      setCachedArtifactImage(artifactId, { error: true })
      return null
    }
    setCachedArtifactImage(artifactId, entry)
    return entry
  } catch {
    setCachedArtifactImage(artifactId, { error: true })
    return null
  }
}

function resolveStreamDataUrl(streamArtifact: InlineArtifactMap[string]): string | null {
  if (!streamArtifact.inlineData?.trim()) return null
  return svgToDataUrl(streamArtifact.inlineData, true)
}

function readCachedDataUrl(artifactId: string): string | null | undefined {
  const cached = getCachedArtifactImage(artifactId)
  if (!cached) return undefined
  return 'error' in cached ? null : cached.dataUrl
}

async function resolveArtifactDataUrl(
  artifactId: string,
  streamArtifact?: InlineArtifactMap[string],
): Promise<string | null> {
  const fromStream = streamArtifact ? resolveStreamDataUrl(streamArtifact) : null
  if (fromStream) return fromStream
  const cached = readCachedDataUrl(artifactId)
  if (cached !== undefined) return cached
  const resolved = await resolveHistoricalArtifactImage(artifactId)
  return resolved?.dataUrl ?? null
}

function useResolvedArtifactUrl(
  artifactId: string | null,
  streamArtifact?: InlineArtifactMap[string],
): { dataUrl: string | null; loading: boolean } {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!artifactId) {
      setDataUrl(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void resolveArtifactDataUrl(artifactId, streamArtifact).then((url) => {
      if (cancelled) return
      setDataUrl(url)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [artifactId, streamArtifact?.inlineData, streamArtifact?.mimeType])

  return { dataUrl, loading }
}

const IMAGE_CLASS = 'my-sm max-w-full rounded-card border border-rule'

export function InlineArtifactImage({
  artifactId: artifactIdProp,
  src,
  alt,
  streamArtifact,
}: InlineArtifactImageProps): JSX.Element | null {
  const artifactId =
    artifactIdProp?.trim() ||
    artifactIdFromImageSrc(src) ||
    null
  const chartLabel = alt?.trim() || streamArtifact?.title?.trim() || 'Chart'
  const { dataUrl, loading } = useResolvedArtifactUrl(artifactId, streamArtifact)

  if (!artifactId) return null

  if (loading) {
    return (
      <div
        className={`${IMAGE_CLASS} flex items-center justify-center bg-paper-2 py-xl`}
        aria-label={`Loading ${chartLabel}`}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-pill bg-accent" aria-hidden />
      </div>
    )
  }

  if (!dataUrl) return null

  return <img src={dataUrl} alt={chartLabel} className={IMAGE_CLASS} loading="lazy" />
}
