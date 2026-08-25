import type { JSX } from 'react'
import { PanelRightIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'
import { useCanvas } from '../../hooks/useCanvas'

export function CanvasToggleButton(): JSX.Element {
  const { isOpen, toggle } = useCanvas()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isOpen}
      aria-label={isOpen ? 'Close canvas' : 'Open canvas'}
      title="Canvas"
      className={cn(
        'grid h-9 w-9 place-items-center rounded-pill border transition-colors duration-short ease-out',
        isOpen
          ? 'border-accent bg-accent-soft text-accent-text'
          : 'border-rule bg-paper-2 text-ink-2 hover:border-accent hover:text-accent-text',
      )}
    >
      <PanelRightIcon className="h-4.5 w-4.5" />
    </button>
  )
}
