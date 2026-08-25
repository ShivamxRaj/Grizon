import { useState, type JSX } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/features/auth/useAuth'
import { getApiErrorMessage } from '@/lib/api/errors'
import { AmbientBackground } from '@/features/landing/components/AmbientBackground'
import { createConversation } from '../api/conversations'
import { useGreeting } from '../hooks/useGreeting'
import { uploadLocalFile } from '../hooks/useFileUpload'
import { setPendingSend } from '../lib/pendingSend'
import { ChatComposer, type ComposerSubmitPayload } from './composer/ChatComposer'



export function EmptyChatState(): JSX.Element {
  const { user } = useAuth()
  const { dateLabel, greeting } = useGreeting(user?.name ?? 'there')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(payload: ComposerSubmitPayload): Promise<void> {
    const trimmed = payload.message.trim()
    const attachments = (payload.attachments ?? []).filter((item) => item.status === 'ready')
    if ((!trimmed && attachments.length === 0) || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const { conversation } = await createConversation({
        defaultAgentSlug: payload.agentSlug,
      })
      const uploadedIds: string[] = []
      for (const attachment of attachments) {
        if (attachment.file) {
          const stored = await uploadLocalFile(attachment.file, conversation.id)
          uploadedIds.push(stored.id)
        } else {
          uploadedIds.push(attachment.id)
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setPendingSend(conversation.id, trimmed || ' ', payload.agentSlug, uploadedIds)
      await navigate({ to: '/chat/$chatId', params: { chatId: conversation.id } })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not start a new chat'))
      setSubmitting(false)
    }
  }

  return (
    <>
      <AmbientBackground />
      <div className="chat-letter-wrap relative flex flex-1 flex-col items-center justify-center px-[var(--page-gutter)] pb-2xl pt-lg text-center">
        <div className="relative z-[1] flex w-full max-w-160 flex-col items-center">
          <p className="mb-sm min-h-[1.4em] text-sm text-muted">{dateLabel || ' '}</p>
          <h1 className="max-w-[20ch] text-[clamp(2rem,3.4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink [overflow-wrap:anywhere]">
            {greeting}
          </h1>
          <p className="mt-sm max-w-[42ch] text-md text-ink-2">
            What should we <span className="font-semibold text-accent-text">focus on</span> today?
          </p>
        </div>

        <div className="relative z-[1] mt-xl flex w-full max-w-[860px] justify-center">
          <ChatComposer
            onSubmit={(payload) => void handleSubmit(payload)}
            disabled={submitting}
          />
        </div>

        {/* Solutions Pillars (Bharat.Law & Lexlegis Gold Standard) */}
        <div className="relative z-[1] mt-lg grid w-full max-w-[860px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-xs px-2xs text-left">
          {[
            {
              icon: '⚖️',
              title: 'Litigation & Precedents',
              desc: 'Supreme Court & High Court ratios with citator signals',
              prompt: 'Search Supreme Court rulings under BNS Section 103 with ratio decidendi.',
              agent: 'legal-counsel',
            },
            {
              icon: '📄',
              title: 'Drafting & Contract Audit',
              desc: 'Clause extraction, risk flags & selection AI editing',
              prompt: 'Audit this commercial contract for indemnity risks & compliance under Indian Law.',
              agent: 'legal-counsel',
            },
            {
              icon: '🏛️',
              title: '15,000+ Court Monitor',
              desc: 'CNR tracking, cause lists & daily order alerts',
              prompt: 'Track CNR number DLHC01-004812-2024 for next hearing date and order status.',
              agent: 'legal-counsel',
            },
            {
              icon: '🔍',
              title: 'OSINT Due Diligence',
              desc: 'Corporate entity search, MCA filings & litigation risk',
              prompt: 'Run an OSINT due diligence search on corporate entity before litigation.',
              agent: 'code-architect',
            },
          ].map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => {
                void handleSubmit({ message: card.prompt, agentSlug: card.agent })
              }}
              className="group flex flex-col justify-between rounded-card border border-[var(--glass-stroke)] bg-[var(--glass-sheen)] p-xs shadow-sm backdrop-blur-[10px] transition-all duration-short ease-out hover:-translate-y-0.5 hover:border-accent-text/40 hover:bg-paper-2 hover:shadow-md"
            >
              <div className="flex items-center gap-xs mb-1">
                <span className="text-md flex-none">{card.icon}</span>
                <b className="font-display text-xs font-semibold text-ink group-hover:text-accent-text transition-colors">
                  {card.title}
                </b>
              </div>
              <p className="text-[0.72rem] text-muted leading-tight line-clamp-2">{card.desc}</p>
            </button>
          ))}
        </div>

        {error && <p className="relative z-[1] mt-sm text-sm text-danger-ink">{error}</p>}

        <p className="relative z-[1] mt-md max-w-full text-xs text-muted sm:whitespace-nowrap">
          Grizon can make mistakes. Check important info before you rely on it.
        </p>
      </div>
    </>
  )
}
