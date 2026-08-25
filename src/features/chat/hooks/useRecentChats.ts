import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/useAuth'
import { conversationsListQueryOptions } from '../api/query'
import { mapConversationsToRecentChats, type RecentChat } from '../lib/recentChats'

const DEFAULT_LIST_LIMIT = 50

export interface UseRecentChatsResult {
  chats: RecentChat[]
  isLoading: boolean
  isError: boolean
  error: unknown
}

export function useRecentChats(limit: number = DEFAULT_LIST_LIMIT): UseRecentChatsResult {
  const { status } = useAuth()
  const authenticated = status === 'authenticated'
  const query = useQuery(conversationsListQueryOptions({ limit }, authenticated))

  if (!authenticated) {
    return { chats: [], isLoading: false, isError: false, error: null }
  }

  return {
    chats: mapConversationsToRecentChats(query.data ?? []),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
