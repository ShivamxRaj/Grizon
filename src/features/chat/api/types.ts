export type ConversationStatus = 'active' | 'archived'
export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error'

export interface Conversation {
  id: string
  userId: string
  title: string
  titleGeneratedAt: string | null
  defaultAgentSlug: string | null
  defaultModelId: string | null
  totalTokensUsed: number
  messageCount: number
  summarisedUpToMsgId: string | null
  summaryText: string | null
  status: ConversationStatus
  pinnedAt: string | null
  tags: string[]
  platform: string
  createdAt: string
  updatedAt: string
  lastMessageAt: string
  /** Reserved for upcoming projects — not returned by the API yet. */
  projectId?: string | null
  /** Reserved for upcoming projects — not returned by the API yet. */
  projectName?: string | null
}

export interface ListConversationsInput {
  cursor?: string
  limit?: number
}

export interface Citation {
  title?: string
  url?: string
  snippet?: string
}

export interface ArtifactMeta {
  id: string
  title: string
  type: string
  filename: string
  extension: string
  mimeType: string
  versionNumber: number
  isLatest: boolean
  fileSize?: number | null
  createdAt: string
}

export type FileProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface MessageFile {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  processingStatus: string
  uploadedAt: string
}

/** Full file row from upload / status / conversation file list. */
export interface StoredFile {
  id: string
  userId: string
  conversationId: string | null
  messageId: string | null
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  processingStatus: FileProcessingStatus
  extractedText: string | null
  vectorised: boolean
  errorMessage: string | null
  uploadedAt: string
}

export interface UploadFileInput {
  conversationId?: string | null
  fileName: string
  fileType: string
  fileSize: number
  contentBase64: string
}

export interface UploadFileResult {
  file: StoredFile
}

/** Full artifact from GET /artifacts/:id and list endpoints. */
export interface ArtifactDetail {
  id: string
  userId: string
  conversationId: string
  messageId: string | null
  title: string
  type: string
  parentId: string | null
  versionNumber: number
  contentHash: string | null
  storagePath: string | null
  contentText: string | null
  createdByAgent: string
  isLatest: boolean
  previewHtml?: string | null
  previewGeneratedAt?: string | null
  fileSize: number | null
  createdAt: string
  filename?: string
  extension?: string
  mimeType?: string
}

export interface ApiMessage {
  id: string
  conversationId: string
  userId: string
  role: MessageRole
  content: string
  attachedFileIds: string[]
  attachedFiles?: MessageFile[]
  artifacts?: ArtifactMeta[]
  inputTokens: number
  outputTokens: number
  creditsDeducted: number
  agentSlug: string | null
  modelId: string | null
  modelProvider: string | null
  webSearchUsed: boolean
  codeExecutionUsed: boolean
  fileAnalysisUsed: boolean
  voiceModeUsed: boolean
  citations: Citation[]
  latencyMs: number | null
  status: MessageStatus
  jobId: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface ConversationDetail {
  conversation: Conversation
  messages: ApiMessage[]
  summary: { text: string; coversUpToMessageId: string | null } | null
}

export interface CreateConversationInput {
  defaultAgentSlug?: string | null
  defaultModelId?: string | null
  tags?: string[]
}

export interface CreateConversationResult {
  conversation: Conversation
}

export interface EnqueueChatInput {
  conversationId: string
  clientMessageId: string
  content: string
  attachedFileIds?: string[]
  agentSlug?: string | null
}

export interface EnqueueChatResult {
  jobId: string
  status: string
  streamUrl: string
}

export type ChatSseEventName =
  | 'queued'
  | 'processing'
  | 'status'
  | 'chunk'
  | 'tool_call'
  | 'tool_result'
  | 'artifact'
  | 'usage'
  | 'done'
  | 'error'
  | 'cancelled'
  | 'heartbeat'

export interface SseQueuedData {
  position?: number
}

export interface SseProcessingData {
  agentSlug?: string | null
  modelId?: string | null
  modelProvider?: string | null
}

export interface SseStatusData {
  content?: string
  phase?: string
  message?: string
}

export interface SseChunkData {
  content: string
}

export interface SseToolCallData {
  callId: string
  toolId?: string
  name?: string
  arguments?: unknown
}

export interface SseToolResultData {
  callId: string
  toolId?: string
  output?: unknown
  durationMs?: number
  summary?: string
}

export interface SseArtifactData {
  artifactId: string
  type?: string
  kind?: string
  title?: string
  filename?: string
  messageId?: string
  inlineData?: string
  mimeType?: string
}

export interface SseUsageData {
  tokensUsed?: {
    inputFresh: number
    inputCached: number
    output: number
    cacheWrite: number
  }
  creditsDeducted?: number
}

export interface SseDoneData {
  messageId: string
  conversationId: string
  status: 'completed'
  durationMs?: number
  llmFirstTokenMs?: number | null
  llmTotalMs?: number | null
  title?: string
  tokensUsed?: {
    input: number
    inputCached: number
    output: number
    cacheWrite: number
  }
}

export interface SseErrorData {
  code?: string
  message?: string
  retryable?: boolean
}

export interface SseCancelledData {
  reason?: string
}

export type ChatSseEvent =
  | { event: 'queued'; data: SseQueuedData }
  | { event: 'processing'; data: SseProcessingData }
  | { event: 'status'; data: SseStatusData }
  | { event: 'chunk'; data: SseChunkData }
  | { event: 'tool_call'; data: SseToolCallData }
  | { event: 'tool_result'; data: SseToolResultData }
  | { event: 'artifact'; data: SseArtifactData }
  | { event: 'usage'; data: SseUsageData }
  | { event: 'done'; data: SseDoneData }
  | { event: 'error'; data: SseErrorData }
  | { event: 'cancelled'; data: SseCancelledData }
  | { event: 'heartbeat'; data: Record<string, unknown> }
  | { event: 'unknown'; name: string; data: Record<string, unknown> }

export type CatalogueAgentType = 'specialized' | 'direct'

export interface CatalogueAgent {
  slug: string
  displayName: string
  shortDescription: string
  longDescription: string
  iconUrl: string | null
  tags: string[]
  agentType: CatalogueAgentType
  directModelId: string | null
  defaultModelId: string | null
  isAutoEligible: boolean
  maxContextTokens: number
  costMultiplier: number
  sortOrder: number
}

export interface CatalogueCategory {
  id: string | null
  slug: string
  name: string
  description: string
  iconUrl: string | null
  sortOrder: number
  agents: CatalogueAgent[]
}

export interface CatalogueModes {
  auto: { available: boolean }
  agent: { available: boolean }
}

export interface CatalogueResponse {
  modes: CatalogueModes
  categories: CatalogueCategory[]
}
