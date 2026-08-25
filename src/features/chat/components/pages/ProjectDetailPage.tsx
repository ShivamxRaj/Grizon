import { useEffect, useMemo, useState, type JSX } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { ChevronLeftIcon, FileLinesIcon, FolderIcon, MessageSquareIcon, SparkleIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'
import { getProjectById, type Project } from '../../data/projects'
import { getChatsForProject, type RecentChat } from '../../lib/recentChats'
import { getProjectArtifacts, getProjectUploads } from '../../data/driveFiles'
import { DEMO_CHAT_ID } from '../../data/conversation'
import { useCanvas } from '../../hooks/useCanvas'
import { ChatComposer } from '../composer/ChatComposer'
import { CanvasToggleButton } from '../canvas/CanvasToggleButton'
import { MobileNavToggle } from '../MobileNavToggle'
import { ProjectKnowledgeModal } from './ProjectKnowledgeModal'
import { tintStyle } from './projectTint'

export function ProjectDetailPage(): JSX.Element {
  const { projectId } = useParams({ from: '/_workspace/projects/$projectId' })
  const project = getProjectById(projectId)

  if (!project) return <ProjectNotFound />
  return <ProjectDetail project={project} />
}

function ProjectDetail({ project }: { project: Project }): JSX.Element {
  const navigate = useNavigate()
  const { setSources } = useCanvas()
  const [knowledgeOpen, setKnowledgeOpen] = useState(false)
  const chats = getChatsForProject(project.name)
  const uploaded = useMemo(() => getProjectUploads(project.name), [project.name])
  const artifacts = useMemo(() => getProjectArtifacts(project.name), [project.name])

  useEffect(() => {
    setSources({ uploaded, artifacts })
    return () => setSources(null)
  }, [uploaded, artifacts, setSources])

  return (
    <main className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[46rem] flex-col px-[var(--page-gutter)] pb-3xl pt-lg">
        <TopBar onOpenKnowledge={() => setKnowledgeOpen(true)} />
        <ProjectHeader project={project} chatCount={chats.length} />
        <div className="flex justify-center pt-xl pb-2xl">
          <ChatComposer onSubmit={() => navigate({ to: '/chat/$chatId', params: { chatId: DEMO_CHAT_ID } })} />
        </div>
        <ProjectChatList chats={chats} />
      </div>
      {knowledgeOpen && <ProjectKnowledgeModal project={project} onClose={() => setKnowledgeOpen(false)} />}
    </main>
  )
}

function TopBar({ onOpenKnowledge }: { onOpenKnowledge: () => void }): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-sm">
      <div className="flex items-center gap-xs">
        <MobileNavToggle />
        <BackLink />
      </div>
      <div className="flex items-center gap-2xs">
        <button
          type="button"
          onClick={onOpenKnowledge}
          className="inline-flex items-center gap-1 rounded-pill border border-rule bg-paper-2 px-sm py-[0.4rem] text-sm text-ink-2 transition-colors duration-short ease-out hover:border-accent hover:text-accent-text"
        >
          <SparkleIcon className="h-3.5 w-3.5" />
          Instructions &amp; memory
        </button>
        <CanvasToggleButton />
      </div>
    </div>
  )
}

function BackLink(): JSX.Element {
  return (
    <Link
      to="/projects"
      className="inline-flex w-fit items-center gap-1 text-sm text-muted transition-colors duration-short ease-out hover:text-ink focus-visible:text-ink focus-visible:outline-none"
    >
      <ChevronLeftIcon className="h-4 w-4" />
      Projects
    </Link>
  )
}

function ProjectHeader({ project, chatCount }: { project: Project; chatCount: number }): JSX.Element {
  return (
    <header className="flex items-start gap-md pt-lg">
      <span className="grid h-12 w-12 flex-none place-items-center rounded-card" style={tintStyle(project.tint)}>
        <FolderIcon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink [overflow-wrap:anywhere]">{project.name}</h1>
        <p className="mt-2xs max-w-[52ch] text-sm text-ink-2">{project.description}</p>
        <div className="mt-xs flex items-center gap-md text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <MessageSquareIcon className="h-3.5 w-3.5" />
            {chatCount} chats
          </span>
          <span className="inline-flex items-center gap-1">
            <FileLinesIcon className="h-3.5 w-3.5" />
            {project.fileCount} files
          </span>
          <span className="tabular-nums">Updated {project.updatedAt}</span>
        </div>
      </div>
    </header>
  )
}

function ProjectChatList({ chats }: { chats: RecentChat[] }): JSX.Element {
  if (chats.length === 0) {
    return (
      <section className="flex flex-col items-center gap-3xs rounded-card border border-dashed border-rule py-2xl text-center">
        <MessageSquareIcon className="h-5 w-5 text-muted" />
        <p className="text-sm text-muted">No chats in this project yet. Start one above.</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col">
      <p className="px-2xs pb-2xs text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-muted">
        Chats in this project · {chats.length}
      </p>
      <div className="border-t border-rule">
        {chats.map((chat) => (
          <ProjectChatRow key={chat.id} chat={chat} />
        ))}
      </div>
    </section>
  )
}

function ProjectChatRow({ chat }: { chat: RecentChat }): JSX.Element {
  return (
    <Link
      to="/chat/$chatId"
      params={{ chatId: chat.id }}
      className="group flex items-center gap-sm border-b border-rule px-2xs py-sm transition-colors duration-short ease-out hover:bg-paper-2 focus-visible:bg-paper-2 focus-visible:outline-none"
    >
      <MessageSquareIcon className={cn('h-4 w-4 flex-none text-muted transition-colors duration-short ease-out', 'group-hover:text-accent-text')} />
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{chat.title}</span>
      <span className="flex-none tabular-nums text-xs text-muted">{chat.timestamp}</span>
    </Link>
  )
}

function ProjectNotFound(): JSX.Element {
  return (
    <main className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-sm px-[var(--page-gutter)] text-center">
      <b className="font-display text-md font-semibold text-ink">Project not found</b>
      <p className="max-w-[38ch] text-sm text-ink-2">This project doesn’t exist or may have been removed.</p>
      <Link to="/projects" className={`${buttonClasses('outline', 'sm')} mt-2xs`}>
        Back to projects
      </Link>
    </main>
  )
}
