import type { Conversation } from '../api/types'
import { formatRelativeTime } from '../lib/formatRelativeTime'

export interface RecentChat {
  id: string
  title: string
  /**
   * Project display name when the chat belongs to a project.
   * Reserved — projects are not wired yet; always undefined from the API today.
   */
  project?: string
  /** Reserved project id for upcoming projects association. */
  projectId?: string
  /** Human-readable relative time, e.g. "2h ago". */
  timestamp: string
  lastMessageAt: string
}

const UNTITLED = 'New Conversation'

export function mapConversationToRecentChat(conversation: Conversation): RecentChat {
  return {
    id: conversation.id,
    title: conversation.title.trim() || UNTITLED,
    project: conversation.projectName ?? undefined,
    projectId: conversation.projectId ?? undefined,
    timestamp: formatRelativeTime(conversation.lastMessageAt || conversation.updatedAt),
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
  }
}

export function mapConversationsToRecentChats(conversations: Conversation[]): RecentChat[] {
  return conversations.map(mapConversationToRecentChat)
}

/** Placeholder until projects ↔ conversations exist. */
export function getChatsForProject(projectName: string, chats: RecentChat[] = []): RecentChat[] {
  return chats.filter((chat) => chat.project === projectName)
}

export function filterChatsByQuery(chats: RecentChat[], query: string): RecentChat[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return chats
  return chats.filter((chat) => {
    const titleMatch = chat.title.toLowerCase().includes(normalized)
    const projectMatch = chat.project?.toLowerCase().includes(normalized) ?? false
    return titleMatch || projectMatch
  })
}
