import { isBoolean, isNumber, isRecord, isString } from '@/lib/api/guards'
import { ApiError } from '@/lib/api/errors'
import type {
  ApiMessage,
  ArtifactMeta,
  CatalogueAgent,
  CatalogueAgentType,
  CatalogueCategory,
  CatalogueResponse,
  Citation,
  Conversation,
  ConversationDetail,
  CreateConversationResult,
  EnqueueChatResult,
  MessageFile,
  MessageRole,
  MessageStatus,
} from './types'

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value)
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new ApiError(500, 'INVALID_RESPONSE', `Expected ${label} object`)
  return value
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(isString)
}

function parseCitation(value: unknown): Citation | null {
  if (!isRecord(value)) return null
  return {
    title: isString(value.title) ? value.title : undefined,
    url: isString(value.url) ? value.url : undefined,
    snippet: isString(value.snippet) ? value.snippet : undefined,
  }
}

function parseCitations(value: unknown): Citation[] {
  if (!Array.isArray(value)) return []
  return value.map(parseCitation).filter((item): item is Citation => item !== null)
}

function parseArtifactMeta(value: unknown): ArtifactMeta | null {
  if (!isRecord(value)) return null
  if (!isString(value.id) || !isString(value.title) || !isString(value.type)) return null
  if (!isString(value.filename) || !isString(value.extension) || !isString(value.mimeType)) return null
  if (!isNumber(value.versionNumber) || !isBoolean(value.isLatest) || !isString(value.createdAt)) {
    return null
  }
  return {
    id: value.id,
    title: value.title,
    type: value.type,
    filename: value.filename,
    extension: value.extension,
    mimeType: value.mimeType,
    versionNumber: value.versionNumber,
    isLatest: value.isLatest,
    fileSize: isNumber(value.fileSize) ? value.fileSize : value.fileSize === null ? null : undefined,
    createdAt: value.createdAt,
  }
}

function parseArtifacts(value: unknown): ArtifactMeta[] {
  if (!Array.isArray(value)) return []
  return value.map(parseArtifactMeta).filter((item): item is ArtifactMeta => item !== null)
}

function parseMessageFile(value: unknown): MessageFile | null {
  if (!isRecord(value)) return null
  if (!isString(value.id) || !isString(value.fileName) || !isString(value.fileType)) return null
  if (!isNumber(value.fileSize) || !isString(value.processingStatus) || !isString(value.uploadedAt)) {
    return null
  }
  return {
    id: value.id,
    fileName: value.fileName,
    fileType: value.fileType,
    fileSize: value.fileSize,
    processingStatus: value.processingStatus,
    uploadedAt: value.uploadedAt,
  }
}

function parseAttachedFiles(value: unknown): MessageFile[] {
  if (!Array.isArray(value)) return []
  return value.map(parseMessageFile).filter((item): item is MessageFile => item !== null)
}

const MESSAGE_ROLES: ReadonlySet<string> = new Set(['user', 'assistant', 'system'])
const MESSAGE_STATUSES: ReadonlySet<string> = new Set(['pending', 'streaming', 'complete', 'error'])

function parseRole(value: unknown): MessageRole {
  if (isString(value) && MESSAGE_ROLES.has(value)) return value as MessageRole
  return 'assistant'
}

function parseStatus(value: unknown): MessageStatus {
  if (isString(value) && MESSAGE_STATUSES.has(value)) return value as MessageStatus
  return 'complete'
}

export function parseConversation(value: unknown): Conversation {
  const row = requireRecord(value, 'conversation')
  if (!isString(row.id) || !isString(row.userId) || !isString(row.title)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Conversation missing required fields')
  }
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    titleGeneratedAt: isNullableString(row.titleGeneratedAt) ? row.titleGeneratedAt : null,
    defaultAgentSlug: isNullableString(row.defaultAgentSlug) ? row.defaultAgentSlug : null,
    defaultModelId: isNullableString(row.defaultModelId) ? row.defaultModelId : null,
    totalTokensUsed: isNumber(row.totalTokensUsed) ? row.totalTokensUsed : 0,
    messageCount: isNumber(row.messageCount) ? row.messageCount : 0,
    summarisedUpToMsgId: isNullableString(row.summarisedUpToMsgId) ? row.summarisedUpToMsgId : null,
    summaryText: isNullableString(row.summaryText) ? row.summaryText : null,
    status: row.status === 'archived' ? 'archived' : 'active',
    pinnedAt: isNullableString(row.pinnedAt) ? row.pinnedAt : null,
    tags: parseStringArray(row.tags),
    platform: isString(row.platform) ? row.platform : 'web',
    createdAt: isString(row.createdAt) ? row.createdAt : '',
    updatedAt: isString(row.updatedAt) ? row.updatedAt : '',
    lastMessageAt: isString(row.lastMessageAt) ? row.lastMessageAt : '',
    projectId: isNullableString(row.projectId) ? row.projectId : undefined,
    projectName: isNullableString(row.projectName) ? row.projectName : undefined,
  }
}

export function parseConversationList(value: unknown): Conversation[] {
  if (!Array.isArray(value)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Expected conversations array')
  }
  return value.map(parseConversation)
}

function mapMessageFlags(row: Record<string, unknown>): Pick<
  ApiMessage,
  | 'webSearchUsed'
  | 'codeExecutionUsed'
  | 'fileAnalysisUsed'
  | 'voiceModeUsed'
  | 'citations'
  | 'latencyMs'
  | 'status'
  | 'jobId'
  | 'errorMessage'
> {
  return {
    webSearchUsed: isBoolean(row.webSearchUsed) ? row.webSearchUsed : false,
    codeExecutionUsed: isBoolean(row.codeExecutionUsed) ? row.codeExecutionUsed : false,
    fileAnalysisUsed: isBoolean(row.fileAnalysisUsed) ? row.fileAnalysisUsed : false,
    voiceModeUsed: isBoolean(row.voiceModeUsed) ? row.voiceModeUsed : false,
    citations: parseCitations(row.citations),
    latencyMs: isNumber(row.latencyMs) ? row.latencyMs : null,
    status: parseStatus(row.status),
    jobId: isNullableString(row.jobId) ? row.jobId : null,
    errorMessage: isNullableString(row.errorMessage) ? row.errorMessage : null,
  }
}

export function parseApiMessage(value: unknown): ApiMessage {
  const row = requireRecord(value, 'message')
  if (!isString(row.id) || !isString(row.conversationId) || !isString(row.content)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Message missing required fields')
  }
  return {
    id: row.id,
    conversationId: row.conversationId,
    userId: isString(row.userId) ? row.userId : '',
    role: parseRole(row.role),
    content: row.content,
    attachedFileIds: parseStringArray(row.attachedFileIds),
    attachedFiles: parseAttachedFiles(row.attachedFiles),
    artifacts: parseArtifacts(row.artifacts),
    inputTokens: isNumber(row.inputTokens) ? row.inputTokens : 0,
    outputTokens: isNumber(row.outputTokens) ? row.outputTokens : 0,
    creditsDeducted: isNumber(row.creditsDeducted) ? row.creditsDeducted : 0,
    agentSlug: isNullableString(row.agentSlug) ? row.agentSlug : null,
    modelId: isNullableString(row.modelId) ? row.modelId : null,
    modelProvider: isNullableString(row.modelProvider) ? row.modelProvider : null,
    ...mapMessageFlags(row),
    createdAt: isString(row.createdAt) ? row.createdAt : '',
    updatedAt: isString(row.updatedAt) ? row.updatedAt : '',
  }
}

export function parseConversationDetail(value: unknown): ConversationDetail {
  const row = requireRecord(value, 'conversation detail')
  const messagesRaw = Array.isArray(row.messages) ? row.messages : []
  const summary =
    isRecord(row.summary) && isString(row.summary.text)
      ? {
          text: row.summary.text,
          coversUpToMessageId: isNullableString(row.summary.coversUpToMessageId)
            ? row.summary.coversUpToMessageId
            : null,
        }
      : null
  return {
    conversation: parseConversation(row.conversation),
    messages: messagesRaw.map(parseApiMessage),
    summary,
  }
}

export function parseCreateConversationResult(value: unknown): CreateConversationResult {
  const row = requireRecord(value, 'create conversation')
  return { conversation: parseConversation(row.conversation) }
}

export function parseEnqueueChatResult(value: unknown): EnqueueChatResult {
  const row = requireRecord(value, 'enqueue chat')
  if (!isString(row.jobId) || !isString(row.status) || !isString(row.streamUrl)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Enqueue response missing required fields')
  }
  return { jobId: row.jobId, status: row.status, streamUrl: row.streamUrl }
}

function pickString(row: Record<string, unknown>, camel: string, snake: string): string | null {
  if (isString(row[camel])) return row[camel]
  if (isString(row[snake])) return row[snake]
  return null
}

function pickNullableString(
  row: Record<string, unknown>,
  camel: string,
  snake: string,
): string | null {
  const camelVal = row[camel]
  if (isNullableString(camelVal)) return camelVal
  const snakeVal = row[snake]
  if (isNullableString(snakeVal)) return snakeVal
  return null
}

function pickNumber(row: Record<string, unknown>, camel: string, snake: string, fallback: number): number {
  if (isNumber(row[camel])) return row[camel]
  if (isNumber(row[snake])) return row[snake]
  if (isString(row[camel]) && row[camel].trim() !== '' && !Number.isNaN(Number(row[camel]))) {
    return Number(row[camel])
  }
  if (isString(row[snake]) && row[snake].trim() !== '' && !Number.isNaN(Number(row[snake]))) {
    return Number(row[snake])
  }
  return fallback
}

function pickBoolean(row: Record<string, unknown>, camel: string, snake: string): boolean {
  if (isBoolean(row[camel])) return row[camel]
  if (isBoolean(row[snake])) return row[snake]
  return false
}

function parseAgentType(value: unknown): CatalogueAgentType {
  return value === 'direct' ? 'direct' : 'specialized'
}

function parseCatalogueAgent(value: unknown): CatalogueAgent | null {
  if (!isRecord(value)) return null
  const slug = pickString(value, 'slug', 'slug')
  const displayName = pickString(value, 'displayName', 'display_name')
  if (!slug || !displayName) return null
  return {
    slug,
    displayName,
    shortDescription: pickString(value, 'shortDescription', 'short_description') ?? '',
    longDescription: pickString(value, 'longDescription', 'long_description') ?? '',
    iconUrl: pickNullableString(value, 'iconUrl', 'icon_url'),
    tags: parseStringArray(value.tags),
    agentType: parseAgentType(pickString(value, 'agentType', 'agent_type')),
    directModelId: pickNullableString(value, 'directModelId', 'direct_model_id'),
    defaultModelId: pickNullableString(value, 'defaultModelId', 'default_model_id'),
    isAutoEligible: pickBoolean(value, 'isAutoEligible', 'is_auto_eligible'),
    maxContextTokens: pickNumber(value, 'maxContextTokens', 'max_context_tokens', 0),
    costMultiplier: pickNumber(value, 'costMultiplier', 'cost_multiplier', 1),
    sortOrder: pickNumber(value, 'sortOrder', 'sort_order', 0),
  }
}

function parseCatalogueAgents(value: unknown): CatalogueAgent[] {
  if (!Array.isArray(value)) return []
  return value.map(parseCatalogueAgent).filter((agent): agent is CatalogueAgent => agent !== null)
}

function parseCatalogueCategory(value: unknown): CatalogueCategory | null {
  if (!isRecord(value)) return null
  const slug = isString(value.slug) ? value.slug : null
  const name = isString(value.name) ? value.name : null
  if (!slug || !name) return null
  return {
    id: value.id === null || isString(value.id) ? (value.id as string | null) : null,
    slug,
    name,
    description: isString(value.description) ? value.description : '',
    iconUrl: pickNullableString(value, 'iconUrl', 'icon_url'),
    sortOrder: pickNumber(value, 'sortOrder', 'sort_order', 0),
    agents: parseCatalogueAgents(value.agents),
  }
}

function parseModeAvailability(value: unknown): { available: boolean } {
  if (isRecord(value) && isBoolean(value.available)) return { available: value.available }
  return { available: true }
}

export function parseCatalogueResponse(value: unknown): CatalogueResponse {
  const row = requireRecord(value, 'catalogue')
  const modes = isRecord(row.modes) ? row.modes : {}
  const categoriesRaw = Array.isArray(row.categories) ? row.categories : []
  return {
    modes: {
      auto: parseModeAvailability(modes.auto),
      agent: parseModeAvailability(modes.agent),
    },
    categories: categoriesRaw
      .map(parseCatalogueCategory)
      .filter((category): category is CatalogueCategory => category !== null),
  }
}
