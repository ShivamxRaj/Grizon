import { useEffect, useLayoutEffect, useRef, useState, type JSX, type RefObject, type SVGProps } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckIcon,
  ChevronDownIcon,
  GeneralAgentIcon,
  SparkleIcon,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'
import type { CatalogueAgent } from '../api/types'
import {
  AUTO_CATALOGUE_OPTION,
  useCatalogue,
  type CataloguePickerOption,
} from '../hooks/useCatalogue'
import { useClickOutside } from '../hooks/useClickOutside'

const MENU_GAP_PX = 8
const MENU_MAX_HEIGHT = 'min(24rem, calc(100vh - 6rem))'

interface MenuCoords {
  bottom: number
  right: number
}

interface AgentPickerProps {
  selectedAgentSlug: string | null
  onSelect: (slug: string | null) => void
}

type FallbackIcon = (props: SVGProps<SVGSVGElement>) => JSX.Element

function resolveOption(
  selectedAgentSlug: string | null,
  agents: CatalogueAgent[],
): CataloguePickerOption {
  if (selectedAgentSlug === null) return AUTO_CATALOGUE_OPTION
  return agents.find((agent) => agent.slug === selectedAgentSlug) ?? AUTO_CATALOGUE_OPTION
}

function fallbackIconFor(option: CataloguePickerOption): FallbackIcon {
  if (option.agentType === 'auto') return SparkleIcon
  return GeneralAgentIcon
}

function OptionIcon({ option }: { option: CataloguePickerOption }): JSX.Element {
  if (option.iconUrl) {
    return (
      <img
        src={option.iconUrl}
        alt=""
        className="h-4 w-4 object-contain"
        width={16}
        height={16}
      />
    )
  }
  const Icon = fallbackIconFor(option)
  return <Icon className="h-4 w-4" />
}

function AgentMenuItem({
  option,
  selected,
  onSelect,
}: {
  option: CataloguePickerOption
  selected: boolean
  onSelect: (slug: string | null) => void
}): JSX.Element {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={() => onSelect(option.slug)}
      className="flex w-full items-center gap-xs rounded-sm p-[0.45rem] text-left transition-colors duration-short ease-out hover:bg-paper-3"
    >
      <span
        className={cn(
          'grid h-7.5 w-7.5 flex-none place-items-center rounded-sm transition-colors duration-short ease-out',
          selected ? 'bg-accent-soft text-accent-text' : 'bg-paper-3 text-ink-2',
        )}
      >
        <OptionIcon option={option} />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate font-body text-sm font-semibold text-ink">{option.displayName}</b>
        <small className="block truncate text-xs text-muted">{option.shortDescription}</small>
      </span>
      {selected && <CheckIcon className="h-3.75 w-3.75 flex-none text-accent-text" />}
    </button>
  )
}

function CategorySection({
  name,
  agents,
  selectedId,
  onSelect,
}: {
  name: string
  agents: CatalogueAgent[]
  selectedId: string | null
  onSelect: (slug: string | null) => void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-px">
      <p className="px-[0.45rem] pb-2xs pt-xs text-xs font-semibold uppercase tracking-[0.06em] text-muted">
        {name}
      </p>
      {agents.map((agent) => (
        <AgentMenuItem
          key={agent.slug}
          option={agent}
          selected={agent.slug === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function AgentMenu({
  anchorRef,
  selectedId,
  categories,
  isLoading,
  onSelect,
}: {
  anchorRef: RefObject<HTMLButtonElement | null>
  selectedId: string | null
  categories: ReturnType<typeof useCatalogue>['categories']
  isLoading: boolean
  onSelect: (slug: string | null) => void
}): JSX.Element | null {
  const [coords, setCoords] = useState<MenuCoords | null>(null)

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const update = (): void => {
      const r = anchor.getBoundingClientRect()
      setCoords({
        bottom: Math.round(window.innerHeight - r.top + MENU_GAP_PX),
        right: Math.round(window.innerWidth - r.right),
      })
    }
    update()
    window.addEventListener('resize', update)
    return (): void => window.removeEventListener('resize', update)
  }, [anchorRef])

  if (!coords) return null

  return createPortal(
    <div
      role="menu"
      aria-label="Choose agent"
      className="agent-picker-menu chat-menu-pop fixed z-[70] flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-px overflow-y-auto rounded-card border p-2xs text-left shadow-glass"
      style={{
        bottom: coords.bottom,
        right: coords.right,
        maxHeight: MENU_MAX_HEIGHT,
        background: 'var(--glass-sheen)',
        borderColor: 'var(--glass-stroke)',
        backdropFilter: 'var(--glass-blur-strong)',
        WebkitBackdropFilter: 'var(--glass-blur-strong)',
      }}
    >
      <AgentMenuItem
        option={AUTO_CATALOGUE_OPTION}
        selected={selectedId === null}
        onSelect={onSelect}
      />
      {isLoading && (
        <p className="px-[0.45rem] py-xs text-xs text-muted">Loading agents…</p>
      )}
      {categories.map((category) =>
        category.agents.length > 0 ? (
          <CategorySection
            key={category.slug}
            name={category.name}
            agents={category.agents}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ) : null,
      )}
    </div>,
    document.body,
  )
}

export function AgentPicker({ selectedAgentSlug, onSelect }: AgentPickerProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { categories, agents, isLoading } = useCatalogue()
  useClickOutside(containerRef, () => setOpen(false), open, '.agent-picker-menu')

  useEffect(() => {
    if (isLoading || selectedAgentSlug === null) return
    if (agents.some((agent) => agent.slug === selectedAgentSlug)) return
    onSelect(null)
  }, [agents, isLoading, onSelect, selectedAgentSlug])

  const selected = resolveOption(selectedAgentSlug, agents)

  const handleSelect = (slug: string | null): void => {
    onSelect(slug)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative flex-none">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Agent: ${selected.displayName}`}
        className={cn(
          'flex items-center gap-[0.35rem] rounded-pill px-[0.6rem] py-[0.4rem] text-sm font-medium text-ink-2 transition-colors duration-short ease-out hover:bg-paper-3 hover:text-ink',
          open && 'bg-accent-soft text-accent-text',
        )}
      >
        <span className="flex h-3.75 w-3.75 flex-none items-center justify-center text-accent-text">
          <OptionIcon option={selected} />
        </span>
        <span className="max-[480px]:hidden">{selected.displayName}</span>
        <ChevronDownIcon
          className={cn(
            'h-3.25 w-3.25 flex-none transition-transform duration-short ease-out',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <AgentMenu
          anchorRef={buttonRef}
          selectedId={selectedAgentSlug}
          categories={categories}
          isLoading={isLoading}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}

