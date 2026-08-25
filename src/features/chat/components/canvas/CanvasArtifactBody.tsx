import type { JSX } from 'react'
import type { Artifact } from '../../types'
import { CanvasEntryPreview } from './CanvasEntryPreview'

/**
 * Artifact cards open via CanvasEntryPreview + blob download.
 * Kept for callers that still pass a MessageArtifact-shaped entry.
 */
export function CanvasArtifactBody({ artifact }: { artifact: Artifact }): JSX.Element {
  return (
    <CanvasEntryPreview
      selection={{
        origin: 'artifact',
        entry: {
          id: artifact.id,
          name: artifact.title,
          meta: artifact.description,
          data: artifact,
        },
      }}
    />
  )
}
