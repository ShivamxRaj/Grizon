import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { JSX } from 'react'
import { stripGrizonTags } from '../../lib/mapApiMessage'
import { InlineArtifactImage } from './InlineArtifactImage'
import { markdownComponents } from './markdownComponents'
import {
  splitContentWithArtifactPlaceholders,
  type ContentSegment,
  type InlineArtifactMap,
} from './markdownUtils'

interface MarkdownBodyProps {
  content: string
  className?: string
  inlineArtifacts?: InlineArtifactMap
}

function MarkdownChunk({
  content,
  components,
}: {
  content: string
  components: Components
}): JSX.Element | null {
  if (!content.trim()) return null
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}

function renderSegment(
  segment: ContentSegment,
  index: number,
  components: Components,
  inlineArtifacts?: InlineArtifactMap,
): JSX.Element | null {
  if (segment.kind === 'artifact') {
    return (
      <InlineArtifactImage
        key={`artifact-${segment.artifactId}-${index}`}
        artifactId={segment.artifactId}
        alt={segment.alt}
        streamArtifact={inlineArtifacts?.[segment.artifactId]}
      />
    )
  }
  return (
    <MarkdownChunk key={`md-${index}`} content={segment.text} components={components} />
  )
}

export function MarkdownBody({ content, className, inlineArtifacts }: MarkdownBodyProps): JSX.Element {
  const cleaned = stripGrizonTags(content)
  const components: Components = markdownComponents(inlineArtifacts)
  const segments = splitContentWithArtifactPlaceholders(cleaned)
  const hasInlineArtifacts = segments.some((segment) => segment.kind === 'artifact')

  return (
    <div className={className ?? 'max-w-[70ch] text-base leading-[1.72] text-ink-2'}>
      {hasInlineArtifacts
        ? segments.map((segment, index) =>
            renderSegment(segment, index, components, inlineArtifacts),
          )
        : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {cleaned}
          </ReactMarkdown>
          )}
    </div>
  )
}
