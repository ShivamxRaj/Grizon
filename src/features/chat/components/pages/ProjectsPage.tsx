import { useState, type JSX } from 'react'
import { Link } from '@tanstack/react-router'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { FolderIcon, MessageSquareIcon, PlusIcon } from '@/components/ui/icons'
import { PROJECTS, type Project } from '../../data/projects'
import { NewProjectModal } from './NewProjectModal'
import { WorkspacePage } from './WorkspacePage'
import { tintStyle } from './projectTint'

export function ProjectsPage(): JSX.Element {
  const [modalOpen, setModalOpen] = useState(false)
  const newProjectButton = (
    <button type="button" onClick={() => setModalOpen(true)} className={buttonClasses('accent', 'sm')}>
      <PlusIcon className="h-4 w-4" />
      New project
    </button>
  )

  return (
    <>
      <WorkspacePage title="Projects" subtitle="Group related chats, files and instructions into a shared workspace." actions={newProjectButton}>
        {PROJECTS.length === 0 ? <ProjectsEmpty onCreate={() => setModalOpen(true)} /> : <ProjectsGrid />}
      </WorkspacePage>
      {modalOpen && <NewProjectModal onClose={() => setModalOpen(false)} />}
    </>
  )
}

function ProjectsGrid(): JSX.Element {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-md">
      {PROJECTS.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

function ProjectCard({ project }: { project: Project }): JSX.Element {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="group flex flex-col gap-sm rounded-card border border-rule bg-paper-2 p-md text-left transition-all duration-short ease-out hover:-translate-y-0.5 hover:border-accent hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
    >
      <span className="grid h-10 w-10 flex-none place-items-center rounded-sm" style={tintStyle(project.tint)}>
        <FolderIcon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <b className="block truncate font-display text-md font-semibold text-ink">{project.name}</b>
        <span className="mt-2xs line-clamp-2 block text-sm text-ink-2">{project.description}</span>
      </span>
      <span className="mt-auto flex items-center gap-md pt-2xs text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <MessageSquareIcon className="h-3.5 w-3.5" />
          {project.chatCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <FolderIcon className="h-3.5 w-3.5" />
          {project.fileCount}
        </span>
        <span className="ml-auto tabular-nums">{project.updatedAt}</span>
      </span>
    </Link>
  )
}

function ProjectsEmpty({ onCreate }: { onCreate: () => void }): JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-sm py-2xl text-center">
      <p className="text-sm font-medium text-ink">No projects yet</p>
      <p className="max-w-[38ch] text-sm text-muted">
        Create your first project to keep related chats, files and instructions together.
      </p>
      <button type="button" onClick={onCreate} className={`${buttonClasses('accent', 'sm')} mt-2xs`}>
        <PlusIcon className="h-4 w-4" />
        Create your first project
      </button>
    </div>
  )
}
