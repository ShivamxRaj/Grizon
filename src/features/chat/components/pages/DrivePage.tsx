import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type CSSProperties, type JSX, type SVGProps } from 'react'
import {
  CodeIcon,
  DownloadIcon,
  EyeIcon,
  FileLinesIcon,
  ImageIcon,
  LayersIcon,
  PanelIcon,
  SparkleIcon,
  TrashIcon,
} from '@/components/ui/icons'
import { getApiErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils/cn'
import { deleteArtifact, downloadArtifact } from '../../api/artifacts'
import type { ArtifactDetail } from '../../api/types'
import { driveArtifactsQueryKey, driveArtifactsQueryOptions } from '../../api/query'
import { useCanvas } from '../../hooks/useCanvas'
import { triggerBlobDownload } from '../../hooks/useCanvasBlobPreview'
import { artifactDisplayFilename } from '../../lib/fileKinds'
import { formatBytes } from '../../lib/fileVisual'
import type { DriveFile, DriveFileKind, DriveFileSource } from '../../data/driveFiles'
import type { MessageArtifact } from '../../types'
import { WorkspacePage } from './WorkspacePage'

type IconComponent = (props: SVGProps<SVGSVGElement>) => JSX.Element
type ViewMode = 'grid' | 'list'

const TABS: { id: DriveFileSource; label: string }[] = [
  { id: 'upload', label: 'Uploads' },
  { id: 'artifact', label: 'Artifacts' },
]

const KIND_ICON: Record<DriveFileKind, IconComponent> = {
  document: FileLinesIcon,
  image: ImageIcon,
  code: CodeIcon,
  artifact: SparkleIcon,
}

const KIND_TINT: Record<DriveFileKind, string> = {
  document: 'var(--color-accent)',
  image: 'var(--color-accent-cool)',
  code: 'var(--color-success)',
  artifact: 'var(--color-accent-deep)',
}

function glyphStyle(kind: DriveFileKind): CSSProperties {
  const hue = KIND_TINT[kind]
  return { color: hue, background: `color-mix(in oklch, ${hue} 15%, transparent)` }
}

function driveKindForArtifact(type: string): DriveFileKind {
  const normalized = type.toLowerCase()
  if (normalized === 'image' || normalized === 'chart') return 'image'
  if (normalized === 'code' || normalized === 'html' || normalized === 'markdown') return 'code'
  if (normalized === 'document' || normalized === 'pdf' || normalized === 'csv' || normalized === 'spreadsheet') {
    return 'document'
  }
  return 'artifact'
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function mapArtifactToDriveFile(artifact: ArtifactDetail): DriveFile {
  const name = artifactDisplayFilename(artifact.title, artifact.type, artifact.extension)
  return {
    id: artifact.id,
    name,
    kind: driveKindForArtifact(artifact.type),
    size: artifact.fileSize != null ? formatBytes(artifact.fileSize) : '—',
    sourceChat: artifact.conversationId,
    updatedAt: formatRelativeDate(artifact.createdAt),
    source: 'artifact',
    conversationId: artifact.conversationId,
    mimeType: artifact.mimeType,
    artifactType: artifact.type,
  }
}

function toCanvasArtifact(file: DriveFile): MessageArtifact {
  const type = file.artifactType ?? 'markdown'
  return {
    id: file.id,
    title: file.name,
    kind: type === 'markdown' || type === 'html' ? 'markdown' : 'code',
    language: type,
    description: file.name,
    content: '',
    filename: file.name,
    mimeType: file.mimeType,
    type,
  }
}

export function DrivePage(): JSX.Element {
  const [tab, setTab] = useState<DriveFileSource>('artifact')
  const [view, setView] = useState<ViewMode>('grid')
  const [actionError, setActionError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { openSelection } = useCanvas()

  const artifactsQuery = useQuery(driveArtifactsQueryOptions(tab === 'artifact'))
  const artifactFiles = useMemo(
    () => (artifactsQuery.data ?? []).map(mapArtifactToDriveFile),
    [artifactsQuery.data],
  )
  const files = tab === 'artifact' ? artifactFiles : []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteArtifact(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: driveArtifactsQueryKey })
    },
  })

  async function handlePreview(file: DriveFile): Promise<void> {
    const artifact = toCanvasArtifact(file)
    openSelection({
      origin: 'artifact',
      entry: { id: artifact.id, name: artifact.title, meta: artifact.description, data: artifact },
    })
  }

  async function handleDownload(file: DriveFile): Promise<void> {
    setActionError(null)
    try {
      const blob = await downloadArtifact(file.id)
      triggerBlobDownload(blob, file.name)
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Download failed'))
    }
  }

  async function handleDelete(file: DriveFile): Promise<void> {
    setActionError(null)
    try {
      await deleteMutation.mutateAsync(file.id)
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Delete failed'))
    }
  }

  const loading = tab === 'artifact' && artifactsQuery.isLoading
  const listError =
    tab === 'artifact' && artifactsQuery.error
      ? getApiErrorMessage(artifactsQuery.error, 'Failed to load artifacts')
      : null

  return (
    <WorkspacePage
      title="Drive"
      subtitle="Every file and artifact created or uploaded across your chats."
      actions={<DriveActions view={view} onView={setView} />}
    >
      <DriveTabs tab={tab} onTab={setTab} artifactCount={artifactFiles.length} />
      <div className="flex min-h-0 flex-1 flex-col pt-md">
        {actionError ? <p className="flex-none text-sm text-danger-ink">{actionError}</p> : null}
        {listError ? <p className="flex-none text-sm text-danger-ink">{listError}</p> : null}
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-2xl">
            <p className="text-sm text-muted">Loading artifacts…</p>
          </div>
        ) : files.length === 0 ? (
          <DriveEmpty tab={tab} />
        ) : view === 'grid' ? (
          <DriveGrid
            files={files}
            onPreview={(file) => void handlePreview(file)}
            onDownload={(file) => void handleDownload(file)}
            onDelete={(file) => void handleDelete(file)}
          />
        ) : (
          <DriveList
            files={files}
            onPreview={(file) => void handlePreview(file)}
            onDownload={(file) => void handleDownload(file)}
            onDelete={(file) => void handleDelete(file)}
          />
        )}
      </div>
    </WorkspacePage>
  )
}

function DriveTabs({
  tab,
  onTab,
  artifactCount,
}: {
  tab: DriveFileSource
  onTab: (t: DriveFileSource) => void
  artifactCount: number
}): JSX.Element {
  return (
    <div role="tablist" aria-label="Drive files" className="flex flex-none items-center gap-2xs border-b border-rule">
      {TABS.map((entry) => {
        const active = tab === entry.id
        const count = entry.id === 'artifact' ? artifactCount : 0
        return (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTab(entry.id)}
            className={cn(
              '-mb-px border-b-2 px-2xs pb-xs pt-2xs text-sm font-medium transition-colors duration-short ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
              active ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {entry.label}
            <span className="ml-1 tabular-nums text-xs text-muted">{count}</span>
          </button>
        )
      })}
    </div>
  )
}

function DriveActions({ view, onView }: { view: ViewMode; onView: (v: ViewMode) => void }): JSX.Element {
  return (
    <div className="flex items-center gap-2xs">
      <div className="flex items-center gap-3xs rounded-pill border border-rule bg-paper-2 p-3xs">
        <ViewToggleButton active={view === 'grid'} label="Grid view" onClick={() => onView('grid')} icon={LayersIcon} />
        <ViewToggleButton active={view === 'list'} label="List view" onClick={() => onView('list')} icon={PanelIcon} />
      </div>
    </div>
  )
}

interface ViewToggleButtonProps {
  active: boolean
  label: string
  onClick: () => void
  icon: IconComponent
}

function ViewToggleButton({ active, label, onClick, icon: Icon }: ViewToggleButtonProps): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-pill transition-colors duration-short ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
        active ? 'bg-accent-soft text-accent-text' : 'text-muted hover:bg-paper-3 hover:text-ink',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

interface DriveFileHandlers {
  onPreview: (file: DriveFile) => void
  onDownload: (file: DriveFile) => void
  onDelete: (file: DriveFile) => void
}

function DriveGrid({ files, ...handlers }: { files: DriveFile[] } & DriveFileHandlers): JSX.Element {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))] gap-md">
      {files.map((file) => (
        <DriveCard key={file.id} file={file} {...handlers} />
      ))}
    </div>
  )
}

function DriveCard({
  file,
  onPreview,
  onDownload,
  onDelete,
}: { file: DriveFile } & DriveFileHandlers): JSX.Element {
  const Icon = KIND_ICON[file.kind]
  return (
    <article className="group flex flex-col gap-sm rounded-card border border-rule bg-paper-2 p-md transition-all duration-short ease-out hover:-translate-y-0.5 hover:border-accent hover:shadow-md">
      <div className="flex items-start justify-between gap-2xs">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-sm" style={glyphStyle(file.kind)}>
          <Icon className="h-5 w-5" />
        </span>
        <FileActions
          onPreview={() => onPreview(file)}
          onDownload={() => onDownload(file)}
          onDelete={() => onDelete(file)}
        />
      </div>
      <div className="min-w-0">
        <b className="block truncate font-display text-sm font-semibold text-ink">{file.name}</b>
        <span className="mt-3xs block truncate text-xs text-muted">{file.sourceChat}</span>
      </div>
      <div className="mt-auto flex items-center justify-between pt-2xs text-xs text-muted">
        <span className="tabular-nums">{file.size}</span>
        <span className="tabular-nums">{file.updatedAt}</span>
      </div>
    </article>
  )
}

function DriveList({ files, ...handlers }: { files: DriveFile[] } & DriveFileHandlers): JSX.Element {
  return (
    <div className="overflow-hidden rounded-card border border-rule bg-paper-2">
      {files.map((file, index) => (
        <DriveRow key={file.id} file={file} divided={index > 0} {...handlers} />
      ))}
    </div>
  )
}

function DriveRow({
  file,
  divided,
  onPreview,
  onDownload,
  onDelete,
}: { file: DriveFile; divided: boolean } & DriveFileHandlers): JSX.Element {
  const Icon = KIND_ICON[file.kind]
  return (
    <div
      className={cn(
        'group flex items-center gap-sm px-md py-xs transition-colors duration-short ease-out hover:bg-paper-3',
        divided && 'border-t border-rule',
      )}
    >
      <span className="grid h-9 w-9 flex-none place-items-center rounded-sm" style={glyphStyle(file.kind)}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <b className="block truncate font-display text-sm font-medium text-ink">{file.name}</b>
        <span className="block truncate text-xs text-muted">{file.sourceChat}</span>
      </div>
      <span className="hidden w-16 flex-none text-right tabular-nums text-xs text-muted sm:block">{file.size}</span>
      <span className="hidden w-24 flex-none text-right tabular-nums text-xs text-muted md:block">
        {file.updatedAt}
      </span>
      <FileActions
        className="max-sm:hidden"
        onPreview={() => onPreview(file)}
        onDownload={() => onDownload(file)}
        onDelete={() => onDelete(file)}
      />
    </div>
  )
}

function FileActions({
  className,
  onPreview,
  onDownload,
  onDelete,
}: {
  className?: string
  onPreview: () => void
  onDownload: () => void
  onDelete: () => void
}): JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-none items-center gap-3xs transition-opacity duration-short ease-out opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100',
        className,
      )}
    >
      <IconAction label="Preview" icon={EyeIcon} onClick={onPreview} />
      <IconAction label="Download" icon={DownloadIcon} onClick={onDownload} />
      <IconAction label="Delete" icon={TrashIcon} danger onClick={onDelete} />
    </div>
  )
}

function IconAction({
  label,
  icon: Icon,
  danger,
  onClick,
}: {
  label: string
  icon: IconComponent
  danger?: boolean
  onClick: () => void
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'grid h-7 w-7 place-items-center rounded-sm text-muted transition-colors duration-short ease-out hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
        danger && 'hover:text-[var(--color-danger)]',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

function DriveEmpty({ tab }: { tab: DriveFileSource }): JSX.Element {
  const isUpload = tab === 'upload'
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2xs py-2xl text-center">
      <p className="text-sm font-medium text-ink">
        {isUpload ? 'Uploads live in each chat' : 'No artifacts yet'}
      </p>
      <p className="max-w-[38ch] text-sm text-muted">
        {isUpload
          ? 'Open a conversation and use Canvas → Files to browse uploads for that chat.'
          : 'Documents and artifacts Grizon creates will show up here.'}
      </p>
    </div>
  )
}
