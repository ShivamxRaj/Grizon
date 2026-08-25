import type { JSX } from 'react'
import type { StreamBlock } from '../../lib/streamReducer'
import { MarkdownBody } from './MarkdownBody'
import { ToolEventRow } from './ToolEventRow'

function PhaseRow({ label }: { label: string }): JSX.Element {
  return (
    <div className="flex items-center gap-xs text-sm text-muted">
      <span className="h-1.5 w-1.5 animate-pulse rounded-pill bg-accent" aria-hidden />
      <span>{label}</span>
    </div>
  )
}

function StatusRow({ text }: { text: string }): JSX.Element {
  return <p className="text-sm italic text-muted">{text}</p>
}

function ArtifactRow({
  block,
}: {
  block: Extract<StreamBlock, { type: 'artifact' }>
}): JSX.Element {
  if (block.inlineData) {
    const mime = block.mimeType ?? 'image/svg+xml'
    return (
      <img
        src={`data:${mime};base64,${block.inlineData}`}
        alt={block.title || 'Generated chart'}
        className="max-w-full rounded-card border border-rule"
      />
    )
  }
  return (
    <div className="rounded-card border border-rule bg-paper-2 px-sm py-xs text-sm text-ink-2">
      {block.title || 'Artifact ready'}
      {block.kind ? ` · ${block.kind}` : ''}
    </div>
  )
}

function renderBlock(
  block: StreamBlock,
  inlineArtifacts: Record<string, { inlineData?: string; mimeType?: string; title?: string }>,
): JSX.Element {
  switch (block.type) {
    case 'phase':
      return <PhaseRow label={block.label} />
    case 'status':
      return <StatusRow text={block.text} />
    case 'tool':
      return <ToolEventRow block={block} />
    case 'markdown':
      return <MarkdownBody content={block.content} inlineArtifacts={inlineArtifacts} />
    case 'artifact':
      return <ArtifactRow block={block} />
  }
}

function collectInlineArtifacts(
  blocks: StreamBlock[],
): Record<string, { inlineData?: string; mimeType?: string; title?: string }> {
  const map: Record<string, { inlineData?: string; mimeType?: string; title?: string }> = {}
  for (const block of blocks) {
    if (block.type !== 'artifact' || !block.inlineData) continue
    map[block.artifactId] = {
      inlineData: block.inlineData,
      mimeType: block.mimeType,
      title: block.title,
    }
  }
  return map
}

export function StreamTimeline({ blocks }: { blocks: StreamBlock[] }): JSX.Element {
  const inlineArtifacts = collectInlineArtifacts(blocks)
  return (
    <div className="flex flex-col gap-sm">
      {blocks.map((block) => (
        <div key={block.type === 'tool' ? block.callId : block.type === 'artifact' ? block.artifactId : block.id}>
          {renderBlock(block, inlineArtifacts)}
        </div>
      ))}
    </div>
  )
}
