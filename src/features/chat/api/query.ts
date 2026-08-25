import type {
  ArtifactDetail,
  CatalogueResponse,
  Conversation,
  ConversationDetail,
  ListConversationsInput,
  StoredFile,
} from '../api/types'
import { listArtifacts, listConversationArtifacts } from '../api/artifacts'
import { fetchCatalogue } from '../api/catalogue'
import { getConversation, listConversations } from '../api/conversations'
import { listConversationFiles } from '../api/files'

export const conversationQueryKey = (id: string): readonly ['conversation', string] => [
  'conversation',
  id,
]

export const conversationsListQueryKey = (
  input: ListConversationsInput = {},
): readonly ['conversations', ListConversationsInput] => ['conversations', input]

export const catalogueQueryKey = ['catalogue'] as const

export const conversationFilesQueryKey = (id: string): readonly ['conversation-files', string] => [
  'conversation-files',
  id,
]

export const conversationArtifactsQueryKey = (
  id: string,
): readonly ['conversation-artifacts', string] => ['conversation-artifacts', id]

export const driveArtifactsQueryKey = ['drive-artifacts'] as const

export function conversationQueryOptions(id: string): {
  queryKey: readonly ['conversation', string]
  queryFn: () => Promise<ConversationDetail>
  enabled: boolean
} {
  return {
    queryKey: conversationQueryKey(id),
    queryFn: () => getConversation(id),
    enabled: Boolean(id),
  }
}

export function conversationsListQueryOptions(
  input: ListConversationsInput = {},
  enabled: boolean = true,
): {
  queryKey: readonly ['conversations', ListConversationsInput]
  queryFn: () => Promise<Conversation[]>
  enabled: boolean
} {
  return {
    queryKey: conversationsListQueryKey(input),
    queryFn: () => listConversations(input),
    enabled,
  }
}

const CATALOGUE_STALE_MS = 5 * 60 * 1000

export function catalogueQueryOptions(enabled: boolean = true): {
  queryKey: typeof catalogueQueryKey
  queryFn: () => Promise<CatalogueResponse>
  enabled: boolean
  staleTime: number
} {
  return {
    queryKey: catalogueQueryKey,
    queryFn: fetchCatalogue,
    enabled,
    staleTime: CATALOGUE_STALE_MS,
  }
}

export function conversationFilesQueryOptions(id: string): {
  queryKey: readonly ['conversation-files', string]
  queryFn: () => Promise<StoredFile[]>
  enabled: boolean
} {
  return {
    queryKey: conversationFilesQueryKey(id),
    queryFn: async () => (await listConversationFiles(id, { limit: 100 })).files,
    enabled: Boolean(id),
  }
}

export function conversationArtifactsQueryOptions(id: string): {
  queryKey: readonly ['conversation-artifacts', string]
  queryFn: () => Promise<ArtifactDetail[]>
  enabled: boolean
} {
  return {
    queryKey: conversationArtifactsQueryKey(id),
    queryFn: async () => (await listConversationArtifacts(id, { limit: 100 })).artifacts,
    enabled: Boolean(id),
  }
}

export function driveArtifactsQueryOptions(enabled: boolean = true): {
  queryKey: typeof driveArtifactsQueryKey
  queryFn: () => Promise<ArtifactDetail[]>
  enabled: boolean
} {
  return {
    queryKey: driveArtifactsQueryKey,
    queryFn: async () => (await listArtifacts({ limit: 100 })).artifacts,
    enabled,
  }
}
