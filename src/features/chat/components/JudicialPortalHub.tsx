import { useState, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'

export interface JudicialPortal {
  id: string
  name: string
  url: string
  category: string
  description: string
  badge: string
  icon: string
  activeService: string
}

export const JUDICIAL_PORTALS: JudicialPortal[] = [
  {
    id: 'ecourts',
    name: 'eCourts Services',
    url: 'https://ecourts.gov.in',
    category: 'Case Status & Cause Lists',
    description: 'National Judicial Data Grid tracking CNR numbers, daily orders & court dates across all 21,000+ courts in India.',
    badge: 'Govt Official',
    icon: '🏛️',
    activeService: 'CNR Lookup & Cause List Sync',
  },
  {
    id: 'kanoon',
    name: 'Indian Kanoon',
    url: 'https://indiankanoon.org',
    category: 'Case Law & Judgments',
    description: 'Comprehensive repository of Supreme Court, High Court & Appellate tribunal rulings from 1950 to 2026.',
    badge: 'Precedents API',
    icon: '📜',
    activeService: 'Ratio Decidendi & Precedent Retrieval',
  },
  {
    id: 'bhashini',
    name: 'Bhashini (MeitY)',
    url: 'https://bhashini.gov.in',
    category: 'Multilingual Translation',
    description: 'Government of India AI platform providing free 22 scheduled Indian language translation (Hindi, Marathi, Tamil, etc.).',
    badge: 'Free Govt AI',
    icon: '🇮🇳',
    activeService: '22 Language Legal Translation',
  },
  {
    id: 'sarvam',
    name: 'Sarvam AI',
    url: 'https://sarvam.ai',
    category: 'Voice & Indic Vision OCR',
    description: 'Production-ready Indic AI providing sub-second Saaras v3 voice dictation and zero-hallucination PDF layout OCR.',
    badge: 'Production AI',
    icon: '🤖',
    activeService: 'Hinglish STT + Court FIR Vision OCR',
  },
  {
    id: 'indiacode',
    name: 'India Code',
    url: 'https://indiacode.nic.in',
    category: 'Bare Acts & Statutes',
    description: 'Digital repository of Central & State Acts, including the IPC ➔ BNS, CrPC ➔ BNSS, and IEA ➔ BSA transition mapping.',
    badge: 'Statutory Base',
    icon: '⚖️',
    activeService: 'BNS 2023 Statutory Transition Engine',
  },
]

interface JudicialPortalHubProps {
  isOpen: boolean
  onClose: () => void
  onSelectPortal?: (portal: JudicialPortal) => void
}

export function JudicialPortalHub({ isOpen, onClose, onSelectPortal }: JudicialPortalHubProps): JSX.Element | null {
  const [activeId, setActiveId] = useState<string>('ecourts')

  if (!isOpen || typeof document === 'undefined') return null

  const activePortal = JUDICIAL_PORTALS.find((p) => p.id === activeId) ?? JUDICIAL_PORTALS[0]

  return createPortal(
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/75 backdrop-blur-md p-md">
      <div
        role="dialog"
        aria-modal="true"
        className="flex h-[min(44rem,calc(100vh-3rem))] w-full max-w-[56rem] flex-col overflow-hidden rounded-card border border-[var(--glass-stroke)] bg-paper shadow-2xl"
        style={{ background: 'var(--glass-sheen)', backdropFilter: 'var(--glass-blur-strong)' }}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-rule px-md py-sm">
          <div className="flex items-center gap-xs">
            <span className="text-xl">🏛️</span>
            <div>
              <h2 className="font-display text-md font-bold text-ink">5 Core Judicial Portal Integrations</h2>
              <p className="text-xs text-muted">Live integrated pipelines driving Grizon Legal AI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-xs text-muted hover:bg-paper-3 hover:text-ink transition-colors"
          >
            ✕
          </button>
        </header>

        {/* Body Split */}
        <div className="grid flex-1 grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Portal List (Left) */}
          <div className="flex flex-col gap-2xs border-r border-rule bg-paper-2/40 p-xs overflow-y-auto">
            <span className="px-2xs py-3xs text-[0.65rem] font-bold uppercase tracking-wider text-muted">
              Live Connected Sources
            </span>
            {JUDICIAL_PORTALS.map((portal) => {
              const selected = portal.id === activeId
              return (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() => {
                    setActiveId(portal.id)
                    onSelectPortal?.(portal)
                  }}
                  className={cn(
                    'flex items-center gap-xs rounded-card p-xs text-left transition-all duration-short ease-out',
                    selected
                      ? 'border border-accent-text/40 bg-accent-soft/40 shadow-sm'
                      : 'hover:bg-paper-3 hover:text-ink',
                  )}
                >
                  <span className="text-lg flex-none">{portal.icon}</span>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-sm font-semibold text-ink">{portal.name}</b>
                    <small className="block truncate text-[0.7rem] text-muted">{portal.category}</small>
                  </div>
                  <span className="rounded-full bg-paper-3 px-1.5 py-0.5 text-[0.6rem] font-medium text-accent-text">
                    {portal.badge}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Active Detail & Live Portal Test (Right 2 cols) */}
          <div className="col-span-2 flex flex-col justify-between p-md overflow-y-auto">
            <div className="flex flex-col gap-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-xs">
                  <span className="text-2xl">{activePortal.icon}</span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">{activePortal.name}</h3>
                    <a
                      href={activePortal.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-xs text-accent-text underline underline-offset-2"
                    >
                      {activePortal.url}
                    </a>
                  </div>
                </div>
                <span className="rounded-pill bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                  ● ACTIVE PIPELINE
                </span>
              </div>

              <p className="text-sm leading-relaxed text-ink-2">{activePortal.description}</p>

              <div className="rounded-card border border-rule bg-paper-2 p-sm flex flex-col gap-2xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Integrated Feature</span>
                <b className="font-display text-sm text-ink">{activePortal.activeService}</b>
                <p className="text-xs text-muted">
                  Grizon AI automatically queries {activePortal.name} during RAG lookup to ensure statutory fidelity and verified citations.
                </p>
              </div>
            </div>

            <div className="mt-md flex justify-end gap-xs border-t border-rule pt-sm">
              <a
                href={activePortal.url}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-pill border border-rule px-md py-2xs text-xs font-semibold text-ink hover:bg-paper-3"
              >
                Visit Official Site ↗
              </a>
              <button
                type="button"
                onClick={onClose}
                className="rounded-pill bg-accent-deep px-md py-2xs text-xs font-semibold text-accent-ink hover:bg-accent-text"
              >
                Use in Grizon AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
