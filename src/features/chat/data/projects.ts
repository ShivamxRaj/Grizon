export type ProjectTint = 'accent' | 'cool' | 'success' | 'warning'

export interface Project {
  id: string
  name: string
  description: string
  chatCount: number
  fileCount: number
  updatedAt: string
  /** One of the token accent hues used to tint the project badge. */
  tint: ProjectTint
  /** User-authored guidance applied to every chat in this project. */
  instructions: string
  /** Claude-maintained summary of durable facts learned across this project's chats. */
  memory: string
}

/** Empty until the projects API is wired. */
export const PROJECTS: Project[] = []

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find((project) => project.id === id)
}
