export interface InlineArtifactMap {
  [id: string]: { inlineData?: string; mimeType?: string; title?: string }
}

const ARTIFACT_SCHEME = 'artifact:'

/** Matches `![title](artifact:uuid)` placeholders saved in message content. */
export const ARTIFACT_PLACEHOLDER_REGEX =
  /!\[([^\]]*)\]\(artifact:([a-z0-9-]+)\)/gi

export type ContentSegment =
  | { kind: 'markdown'; text: string }
  | { kind: 'artifact'; artifactId: string; alt: string }

type CachedArtifactImage = { dataUrl: string; mimeType: string } | { error: true }

const historicalImageCache = new Map<string, CachedArtifactImage>()

export function isArtifactSrc(src: string | undefined): src is string {
  return Boolean(src?.startsWith(ARTIFACT_SCHEME))
}

export function artifactIdFromSrc(src: string): string {
  return src.slice(ARTIFACT_SCHEME.length)
}

/** Extract `artifact:` scheme id from an image `src`, if present. */
export function artifactIdFromImageSrc(src: string | undefined): string | null {
  if (!isArtifactSrc(src)) return null
  const id = artifactIdFromSrc(src).trim()
  return id || null
}

/** Parse unique artifact IDs from message markdown content. */
export function parseArtifactPlaceholderIds(content: string): string[] {
  if (!content) return []
  const ids = new Set<string>()
  const re = new RegExp(ARTIFACT_PLACEHOLDER_REGEX.source, 'gi')
  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    const id = match[2]?.trim()
    if (id) ids.add(id)
  }
  return [...ids]
}

/** Build a data URL for inline SVG (raw XML or base64 from SSE). */
export function svgToDataUrl(svgOrBase64: string, isBase64 = false): string {
  if (isBase64) return `data:image/svg+xml;base64,${svgOrBase64}`
  const trimmed = svgOrBase64.trim()
  if (trimmed.startsWith('data:')) return trimmed
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`
}

export function getCachedArtifactImage(artifactId: string): CachedArtifactImage | undefined {
  return historicalImageCache.get(artifactId)
}

export function setCachedArtifactImage(artifactId: string, entry: CachedArtifactImage): void {
  historicalImageCache.set(artifactId, entry)
}

function pushArtifactSegment(
  segments: ContentSegment[],
  match: RegExpExecArray,
): void {
  const artifactId = match[2]?.trim()
  if (!artifactId) return
  const alt = (match[1] ?? 'Chart').trim() || 'Chart'
  segments.push({ kind: 'artifact', artifactId, alt })
}

/**
 * Remove duplicate `![…](url)` images whose URL embeds an artifact id already
 * shown via `artifact:` placeholders (e.g. hallucinated CDN URLs).
 */
export function stripDuplicateArtifactUrls(text: string, artifactIds: string[]): string {
  if (!text || artifactIds.length === 0) return text
  let result = text
  for (const id of artifactIds) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`!\\[[^\\]]*\\]\\([^\\)]*${escaped}[^\\)]*\\)`, 'gi'), '')
  }
  return result
}

function applyDuplicateUrlStrip(segments: ContentSegment[]): ContentSegment[] {
  const artifactIds = segments
    .filter((s): s is Extract<ContentSegment, { kind: 'artifact' }> => s.kind === 'artifact')
    .map((s) => s.artifactId)
  if (artifactIds.length === 0) return segments
  return segments.map((segment) =>
    segment.kind === 'markdown'
      ? { ...segment, text: stripDuplicateArtifactUrls(segment.text, artifactIds) }
      : segment,
  )
}

/** Split message content into markdown runs and inline artifact placeholders. */
export function splitContentWithArtifactPlaceholders(content: string): ContentSegment[] {
  if (!content) return [{ kind: 'markdown', text: '' }]

  const segments: ContentSegment[] = []
  const re = new RegExp(ARTIFACT_PLACEHOLDER_REGEX.source, 'gi')
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index)
    if (before) segments.push({ kind: 'markdown', text: before })
    pushArtifactSegment(segments, match)
    lastIndex = re.lastIndex
  }

  const tail = content.slice(lastIndex)
  if (tail || segments.length === 0) segments.push({ kind: 'markdown', text: tail })
  return applyDuplicateUrlStrip(segments)
}
