import { useCallback, useEffect, useRef, type ChangeEvent, type FormEvent, type JSX, type KeyboardEvent } from 'react'
import { useComposer } from '../../hooks/useComposer'
import { useDragAndDrop } from '../../hooks/useDragAndDrop'
import { useSelectedAgentSlug } from '../../hooks/useSelectedAgentSlug'
import type { ComposerAttachment } from './types'
import { ComposerAttachmentList } from './ComposerAttachmentList'
import { AddAttachmentButton } from './AddAttachmentButton'
import { ComposerActions } from './ComposerActions'
import { ACCEPTED_TYPES } from './constants'

export interface ComposerSubmitPayload {
  message: string
  attachments?: ComposerAttachment[]
  agentSlug: string | null
}

interface ChatComposerProps {
  onSubmit?: (payload: ComposerSubmitPayload) => void
  disabled?: boolean
  conversationId?: string | null
  externalValue?: string
}

export function ChatComposer({
  onSubmit,
  disabled,
  conversationId = null,
  externalValue = '',
}: ChatComposerProps): JSX.Element {
  const { selectedAgentSlug, setSelectedAgentSlug } = useSelectedAgentSlug()
  const handlePayload = useCallback(
    (message: string, attachments: ComposerAttachment[]): void => {
      onSubmit?.({ message, attachments, agentSlug: selectedAgentSlug })
    },
    [onSubmit, selectedAgentSlug],
  )
  const composer = useComposer(handlePayload, conversationId)

  useEffect(() => {
    if (externalValue) {
      composer.setValue(externalValue)
      composer.textareaRef.current?.focus()
    }
  }, [externalValue])
  const { active: dragActive, dragProps } = useDragAndDrop(composer.addFiles)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasContent = composer.value.trim().length > 0 || composer.attachments.length > 0
  const expanded = composer.multiline || composer.attachments.length > 0
  const canSubmit = !disabled && composer.canSubmit

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (disabled) return
    composer.submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== 'Enter' || event.shiftKey || disabled) return
    event.preventDefault()
    composer.submit()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    if (event.target.files && event.target.files.length > 0) composer.addFiles(event.target.files)
    event.target.value = ''
  }

  return (
    <form
      {...dragProps}
      onSubmit={handleSubmit}
      data-expanded={expanded}
      data-drag={dragActive}
      className="chat-composer w-full max-w-160 shadow-glass backdrop-blur-[10px]"
      style={{ background: 'var(--glass-sheen)' }}
    >
      <ComposerAttachmentList attachments={composer.attachments} onRemove={composer.removeAttachment} />

      <AddAttachmentButton onClick={() => fileInputRef.current?.click()} />

      <textarea
        ref={composer.textareaRef}
        rows={1}
        value={composer.value}
        onChange={(event) => composer.setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Grizon"
        aria-label="Ask Grizon"
        disabled={disabled}
        className="chat-composer-input w-full resize-none border-0 bg-transparent text-base leading-relaxed text-ink outline-none placeholder:text-muted disabled:opacity-60"
      />

      <ComposerActions
        showSend={hasContent}
        canSubmit={canSubmit}
        selectedAgentSlug={selectedAgentSlug}
        onAgentSelect={setSelectedAgentSlug}
        onTranscript={(text) => {
          const current = composer.value
          composer.setValue(current ? `${current} ${text}` : text)
          // Automatically resize/focus textarea after setting the value
          setTimeout(() => {
            if (composer.textareaRef.current) {
              composer.textareaRef.current.focus()
              // Fire an input event so any height adjustments trigger
              const event = new Event('input', { bubbles: true })
              composer.textareaRef.current.dispatchEvent(event)
            }
          }, 50)
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES}
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </form>
  )
}
