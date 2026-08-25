import type { JSX } from 'react'
import { cn } from '@/lib/utils/cn'
import { useExpandable } from '../../hooks/useExpandable'
import type { UserMessage } from '../../types'
import { AttachmentChip } from './AttachmentChip'

const CLAMP_THRESHOLD_CHARS = 220

export function UserTurn({ message }: { message: UserMessage }): JSX.Element {
  const { expanded, toggle } = useExpandable()
  const isLong = message.content.length > CLAMP_THRESHOLD_CHARS

  return (
    <div className="flex flex-col items-end gap-2xs">
      {message.attachments && message.attachments.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2xs">
          {message.attachments.map((attachment) => (
            <AttachmentChip key={attachment.id} attachment={attachment} />
          ))}
        </div>
      )}

      <div
        className={cn(
          'max-w-[62ch] rounded-[18px_18px_5px_18px] border border-rule bg-paper-3 px-sm py-xs text-sm leading-relaxed text-ink sm:max-w-[50ch]',
          !expanded && isLong && 'line-clamp-3',
        )}
      >
        {message.content}
      </div>

      {isLong && (
        <button
          type="button"
          onClick={toggle}
          className="p-0 text-xs text-muted transition-colors duration-short ease-out hover:text-accent-text"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}
