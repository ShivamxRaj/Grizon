import type { JSX } from 'react'
import { ChatComposer, type ComposerSubmitPayload } from './composer/ChatComposer'

interface ConversationFooterProps {
  onSubmit?: (payload: ComposerSubmitPayload) => void
  disabled?: boolean
  conversationId?: string | null
}

export function ConversationFooter({
  onSubmit,
  disabled,
  conversationId = null,
}: ConversationFooterProps): JSX.Element {
  return (
    <div className="flex-none border-t border-rule-2 px-lg pb-md pt-sm sm:px-5">
      <div className="mx-auto flex max-w-[860px] justify-center">
        <ChatComposer
          onSubmit={disabled ? undefined : onSubmit}
          disabled={disabled}
          conversationId={conversationId}
        />
      </div>
      <div className="mt-xs flex flex-wrap items-center justify-center gap-sm text-[0.7rem] text-muted">
        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>INSC Live Grounded</span>
        </span>
        <span className="text-muted-2">•</span>
        <span className="inline-flex items-center gap-1 text-purple-400 font-semibold">
          <span>🛡️</span>
          <span>Presidio Shield Active</span>
        </span>
        <span className="text-muted-2">•</span>
        <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
          <span>⚖️</span>
          <span>BNS-IPC Map Engaged</span>
        </span>
      </div>
      <p className="mt-[0.35rem] text-center text-xs text-muted-2">
        Grizon can make mistakes. Check important info before you rely on it.
      </p>
    </div>
  )
}
