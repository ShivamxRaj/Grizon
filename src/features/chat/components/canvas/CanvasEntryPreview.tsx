import type { JSX } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CopyIcon, DownloadIcon, FileLinesIcon } from '@/components/ui/icons'
import {
  copyTextToClipboard,
  triggerBlobDownload,
  useCanvasBlobPreview,
  type CanvasBlobPreview,
} from '../../hooks/useCanvasBlobPreview'
import type { SpreadsheetPreview } from '../../lib/filePreview'
import type { CanvasViewerKind } from '../../lib/fileVisual'
import type { CanvasSelection } from '../../types'

export function CanvasEntryPreview({ selection }: { selection: CanvasSelection }): JSX.Element {
  const preview = useCanvasBlobPreview(selection)
  const section = selection.origin === 'uploaded' ? 'Uploaded files' : 'Artifacts'
  const name = selection.origin === 'uploaded' ? selection.attachment.name : selection.entry.name

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CanvasBreadcrumb
        section={section}
        name={name}
        preview={preview}
      />
      <CanvasPreviewBody preview={preview} />
    </div>
  )
}

function CanvasBreadcrumb({
  section,
  name,
  preview,
}: {
  section: string
  name: string
  preview: CanvasBlobPreview
}): JSX.Element {
  const canCopy = Boolean(preview.textContent)
  const canDownload = Boolean(preview.blob)

  async function handleCopy(): Promise<void> {
    if (!preview.textContent) return
    try {
      await copyTextToClipboard(preview.textContent)
    } catch {
      // Clipboard may be denied; ignore.
    }
  }

  function handleDownload(): void {
    if (!preview.blob) return
    triggerBlobDownload(preview.blob, preview.downloadName)
  }

  return (
    <div className="flex flex-none items-center gap-xs border-b border-rule-2 px-md py-[0.6rem] text-sm">
      <span className="text-muted">{section}</span>
      <span className="text-muted">/</span>
      <span className="min-w-0 flex-1 truncate font-medium text-ink">{name}</span>
      <CanvasIconButton icon={CopyIcon} label="Copy" disabled={!canCopy} onClick={() => void handleCopy()} />
      <CanvasIconButton
        icon={DownloadIcon}
        label="Download"
        disabled={!canDownload}
        onClick={handleDownload}
      />
    </div>
  )
}

function CanvasIconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: (props: { className?: string }) => JSX.Element
  label: string
  onClick: () => void
  disabled?: boolean
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7.5 w-7.5 flex-none place-items-center rounded-sm text-muted transition-colors duration-short ease-out hover:bg-paper-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon className="h-3.75 w-3.75" />
    </button>
  )
}

function CanvasPreviewBody({ preview }: { preview: CanvasBlobPreview }): JSX.Element {
  if (preview.loading) {
    return <PreviewMessage message="Loading preview…" />
  }
  if (preview.error) {
    return <PreviewMessage message={preview.error} />
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PreviewContent preview={preview} />
      <div className="flex flex-none items-center justify-between border-t border-rule-2 px-md py-[0.5rem] font-mono text-[0.68rem] text-muted">
        <span>{statusLabel(preview.kind, preview)}</span>
        <span>{preview.label}</span>
      </div>
    </div>
  )
}

function PreviewMessage({ message }: { message: string }): JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-paper-2 p-lg">
      <p className="text-sm text-muted">{message}</p>
    </div>
  )
}

function PreviewContent({ preview }: { preview: CanvasBlobPreview }): JSX.Element {
  if (preview.kind === 'image' && preview.objectUrl) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-paper-2 p-md">
        <img src={preview.objectUrl} alt={preview.label} className="max-h-full max-w-full object-contain" />
      </div>
    )
  }
  if (preview.kind === 'pdf' && preview.objectUrl) {
    return (
      <iframe
        title={preview.label}
        src={preview.objectUrl}
        className="min-h-0 flex-1 border-0 bg-paper-2"
      />
    )
  }
  if (preview.kind === 'html' && preview.objectUrl) {
    return (
      <iframe
        title={preview.label}
        src={preview.objectUrl}
        sandbox=""
        className="min-h-0 flex-1 border-0 bg-paper-2"
      />
    )
  }
  if (preview.kind === 'readme') {
    return (
      <div className="min-h-0 flex-1 overflow-auto bg-paper-2 p-md text-sm leading-[1.6] text-ink-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview.textContent}</ReactMarkdown>
      </div>
    )
  }
  if (preview.kind === 'code' || preview.kind === 'json') {
    return <LineNumberedText lines={preview.textLines} />
  }
  if (preview.kind === 'docx') {
    return (
      <div className="min-h-0 flex-1 overflow-auto bg-paper-2 p-md">
        {preview.docxParagraphs.map((paragraph, index) => (
          <p key={`p-${index}`} className="mb-sm text-sm leading-[1.6] text-ink-2 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
    )
  }
  if (preview.kind === 'spreadsheet' && preview.spreadsheet) {
    return <SpreadsheetTable table={preview.spreadsheet} />
  }
  return <BinaryFallback name={preview.downloadName} />
}

function LineNumberedText({ lines }: { lines: string[] }): JSX.Element {
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-paper-2">
      <pre className="p-md font-mono text-[0.8rem] leading-[1.65] text-ink-2">
        <code>
          {lines.map((line, index) => (
            <span key={`l-${index}`} className="block">
              <span className="mr-sm inline-block w-8 select-none text-right text-muted">{index + 1}</span>
              {line || ' '}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}

function SpreadsheetTable({ table }: { table: SpreadsheetPreview }): JSX.Element {
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-paper-2">
      <table className="w-max min-w-full border-collapse text-left font-mono text-[0.72rem] text-ink-2">
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={`r-${rowIndex}`} className="border-b border-rule-2">
              {row.map((cell, colIndex) => (
                <td key={`c-${rowIndex}-${colIndex}`} className="whitespace-nowrap px-xs py-[0.35rem]">
                  {cell || ' '}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.truncated ? (
        <p className="px-md py-xs text-xs text-muted">Preview truncated</p>
      ) : null}
    </div>
  )
}

function BinaryFallback({ name }: { name: string }): JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-sm overflow-auto bg-paper-2 p-lg text-center">
      <div className="grid h-16 w-16 place-items-center rounded-card border border-rule bg-paper shadow-sm">
        <FileLinesIcon className="h-7 w-7 text-muted" />
      </div>
      <p className="max-w-70 truncate text-sm font-medium text-ink">{name}</p>
      <p className="text-sm text-muted">Download to open this file</p>
    </div>
  )
}

function statusLabel(kind: CanvasViewerKind, preview: CanvasBlobPreview): string {
  if (kind === 'code') return `Text · ${preview.textLines.length} lines`
  if (kind === 'json') return `JSON · ${preview.textLines.length} lines`
  if (kind === 'readme') return `Markdown · ${preview.textLines.length} lines`
  if (kind === 'pdf') return 'PDF · Preview'
  if (kind === 'image') return 'Image · Preview'
  if (kind === 'html') return 'HTML · Preview'
  if (kind === 'docx') return `DOCX · ${preview.docxParagraphs.length} paragraphs`
  if (kind === 'spreadsheet') {
    const rows = preview.spreadsheet?.rows.length ?? 0
    const cols = preview.spreadsheet?.rows[0]?.length ?? 0
    const suffix = preview.spreadsheet?.truncated ? ' (truncated)' : ''
    return `Spreadsheet · ${rows}×${cols}${suffix}`
  }
  return 'Binary · Download to open'
}
