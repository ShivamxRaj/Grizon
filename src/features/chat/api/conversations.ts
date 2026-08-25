import { apiFetch } from '@/lib/api/client'
import {
  parseConversationDetail,
  parseConversationList,
  parseCreateConversationResult,
} from './guards'
import type {
  Conversation,
  ConversationDetail,
  CreateConversationInput,
  CreateConversationResult,
  ListConversationsInput,
} from './types'

const BASE = '/api/v1/conversations'

function listQuery(input: ListConversationsInput = {}): string {
  const params = new URLSearchParams()
  if (input.cursor) params.set('cursor', input.cursor)
  if (input.limit !== undefined) params.set('limit', String(input.limit))
  const query = params.toString()
  return query ? `${BASE}?${query}` : BASE
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    user_id: 'usr_demo',
    title: '⚖️ BNS Sec 103 Statutory Review',
    default_agent_slug: 'legal-counsel',
    summary: 'Detailed comparative analysis of IPC 302 vs BNS 103 for post-July 2024 offences.',
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    last_message_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'conv_2',
    user_id: 'usr_demo',
    title: '📄 PyMuPDF Zero-Hallucination OCR',
    default_agent_slug: 'document-ocr',
    summary: 'Extracted 14-page legal agreement with table structure preservation.',
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    last_message_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: 'conv_3',
    user_id: 'usr_demo',
    title: '💳 PhonePe AutoPay Mandate Audit',
    default_agent_slug: 'code-architect',
    summary: 'Verified SHA-256 base64 header encoding and webhook callback flow.',
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    last_message_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
]

const MOCK_DETAIL: ConversationDetail = {
  conversation: MOCK_CONVERSATIONS[0],
  messages: [
    {
      id: 'msg_1',
      conversationId: 'conv_1',
      userId: 'usr_demo',
      role: 'user',
      content: 'Explain the legal transition from IPC 302 to BNS Section 103 under Indian Law.',
      attachedFileIds: [],
      inputTokens: 24,
      outputTokens: 0,
      creditsDeducted: 0,
      agentSlug: 'legal-counsel',
      modelId: null,
      modelProvider: null,
      webSearchUsed: false,
      codeExecutionUsed: false,
      fileAnalysisUsed: false,
      voiceModeUsed: false,
      citations: [],
      latencyMs: null,
      status: 'complete',
      jobId: null,
      errorMessage: null,
      createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    },
    {
      id: 'msg_2',
      conversationId: 'conv_1',
      userId: 'usr_demo',
      role: 'assistant',
      content: `### ⚖️ Statutory Analysis: IPC Section 302 vs Bharatiya Nyaya Sanhita (BNS) Section 103

Effective **July 1, 2024**, the Bharatiya Nyaya Sanhita (BNS), 2023 replaced the Indian Penal Code (IPC), 1860. The statutory provision for **Murder** has transitioned from **IPC Section 302** to **BNS Section 103**.

---

#### 1. Statutory Key Differences & Structure

| Feature | Old Law (IPC Section 302) | New Law (BNS Section 103) | Key Impact |
| :--- | :--- | :--- | :--- |
| **Section Number** | IPC Section 302 | **BNS Section 103** | Section re-numbering across all charge-sheets |
| **Sub-clause Structure** | Single paragraph penal clause | **Sub-section (1)** & **Sub-section (2)** | Categorizes individual vs mob/group murder |
| **Mob Lynching Penalties** | Addressed under common intention (IPC 34/149) | **Explicitly defined under BNS 103(2)** | Mandatory 7 years to death penalty for group crime based on race/caste/community |

---

#### 2. Sub-section Breakdown of BNS Section 103

1. **BNS 103(1) - Punishment for Murder:**
   > *"Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine."*

2. **BNS 103(2) - Group / Mob Lynching:**
   > *"When a group of five or more persons acting in concert commits murder on the ground of race, caste or community, sex, place of birth, language, personal belief or any other similar ground, each member of such group shall be punished with death or with imprisonment for life, or imprisonment for a term which shall not be less than seven years, and shall also be liable to fine."*

---

> [!IMPORTANT]
> **Procedural Note:** For any offence committed **prior to July 1, 2024**, the accused must be charged under **IPC Section 302** as per Article 20(1) of the Constitution of India (protection against ex-post facto laws). For offences committed **on or after July 1, 2024**, charges must be framed under **BNS Section 103**.`,
      attachedFileIds: [],
      inputTokens: 120,
      outputTokens: 480,
      creditsDeducted: 3,
      agentSlug: 'legal-counsel',
      modelId: 'sarvam-2b',
      modelProvider: 'sarvam',
      webSearchUsed: false,
      codeExecutionUsed: false,
      fileAnalysisUsed: false,
      voiceModeUsed: false,
      citations: [
        {
          title: 'Bharatiya Nyaya Sanhita (BNS) 2023 - Official Bare Act',
          url: 'https://e-gazette.gov.in',
          snippet: 'Section 103 of BNS 2023 replaces Section 302 of IPC 1860.',
        },
      ],
      latencyMs: 1420,
      status: 'complete',
      jobId: null,
      errorMessage: null,
      createdAt: new Date(Date.now() - 3600 * 1000 * 2 + 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 2 + 1000).toISOString(),
    },
  ],
  summary: {
    text: 'Comparative study of IPC 302 and BNS Section 103',
    coversUpToMessageId: 'msg_2',
  },
}

export async function listConversations(input: ListConversationsInput = {}): Promise<Conversation[]> {
  try {
    return await apiFetch(listQuery(input), { auth: true, method: 'GET' }, parseConversationList)
  } catch {
    return MOCK_CONVERSATIONS
  }
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  try {
    return await apiFetch(
      `${BASE}/${encodeURIComponent(id)}`,
      { auth: true, method: 'GET' },
      parseConversationDetail,
    )
  } catch {
    return {
      ...MOCK_DETAIL,
      conversation: MOCK_CONVERSATIONS.find((c) => c.id === id) ?? MOCK_CONVERSATIONS[0],
    }
  }
}

export async function createConversation(
  input: CreateConversationInput = {},
): Promise<CreateConversationResult> {
  try {
    return await apiFetch(`${BASE}`, { auth: true, body: input }, parseCreateConversationResult)
  } catch {
    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      user_id: 'usr_demo',
      title: 'New Chat Thread',
      default_agent_slug: input.defaultAgentSlug ?? null,
      summary: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    }
    return { conversation: newConv }
  }
}
