import type { JSX } from 'react'
import type { StreamBlock } from '../../lib/streamReducer'

const TOOL_LABELS: Record<string, string> = {
  web_search: 'Web search',
  web_fetch: 'Fetch page',
  code_execution: 'Code execution',
  file_read: 'Read file',
  file_gen: 'Generate file',
  html_generate: 'Generate HTML',
  chart_generate: 'Generate chart',
  image_analyse: 'Analyse image',
  video_analyse: 'Analyse video',
  stock_data: 'Stock data',
  get_weather: 'Weather',
}

function toolLabel(toolId: string): string {
  return TOOL_LABELS[toolId] ?? toolId.replace(/_/g, ' ')
}

function formatDuration(ms?: number): string | null {
  if (typeof ms !== 'number') return null
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function ToolEventRow({
  block,
}: {
  block: Extract<StreamBlock, { type: 'tool' }>
}): JSX.Element {
  const duration = formatDuration(block.durationMs)
  const subtitle = block.phase === 'done' ? block.resultSummary : block.argsSummary

  return (
    <div className="flex flex-col gap-3xs rounded-card border border-rule bg-paper-2 px-sm py-xs">
      <div className="flex items-center gap-xs text-sm">
        <span
          className={`h-1.5 w-1.5 flex-none rounded-pill ${
            block.phase === 'running' ? 'animate-pulse bg-accent' : 'bg-success'
          }`}
          aria-hidden
        />
        <span className="font-medium text-ink">{toolLabel(block.toolId)}</span>
        <span className="text-muted">{block.phase === 'running' ? 'Running…' : 'Done'}</span>
        {duration && <span className="ml-auto text-xs text-muted">{duration}</span>}
      </div>
      {subtitle && <p className="truncate pl-[1.1rem] text-xs text-ink-2">{subtitle}</p>}
    </div>
  )
}
