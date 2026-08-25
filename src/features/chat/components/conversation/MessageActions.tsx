import { useState, type JSX } from 'react'
import { CopyIcon, RefreshIcon, ThumbsDownIcon, ThumbsUpIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'

type Vote = 'up' | 'down' | null

export function MessageActions(): JSX.Element {
  const [vote, setVote] = useState<Vote>(null)

  function toggleVote(next: Vote): void {
    setVote((current) => (current === next ? null : next))
  }

  return (
    <div className="mt-[0.1rem] flex items-center gap-px">
      <ActionButton
        label="Helpful"
        active={vote === 'up'}
        onClick={() => toggleVote('up')}
        icon={ThumbsUpIcon}
      />
      <ActionButton
        label="Not helpful"
        active={vote === 'down'}
        onClick={() => toggleVote('down')}
        icon={ThumbsDownIcon}
      />
      <ActionButton label="Regenerate" icon={RefreshIcon} />
      <ActionButton label="Copy response" icon={CopyIcon} />
    </div>
  )
}

interface ActionButtonProps {
  label: string
  icon: (props: { className?: string }) => JSX.Element
  active?: boolean
  onClick?: () => void
}

function ActionButton({ label, icon: Icon, active, onClick }: ActionButtonProps): JSX.Element {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'grid h-7.5 w-7.5 place-items-center rounded-sm transition-colors duration-short ease-out hover:bg-paper-3 hover:text-ink',
        active ? 'text-accent-text' : 'text-muted',
      )}
    >
      <Icon className="h-3.75 w-3.75" />
    </button>
  )
}
