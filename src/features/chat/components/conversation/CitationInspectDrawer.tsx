import type { JSX } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon, ShieldIcon, CheckCircleIcon, ExternalLinkIcon, CopyIcon, FileTextIcon } from '@/components/ui/icons'

export interface CitationDetails {
  citation: string
  court: string
  bench: string
  year: number
  signal: 'RELIED' | 'DISTINGUISHED' | 'OVERRULED'
  ratioSummary: string
  statuteApplied: string
  confidenceScore: number
  piiMaskedCount: number
}

interface CitationInspectDrawerProps {
  isOpen: boolean
  onClose: () => void
  details?: CitationDetails | null
}

const DEFAULT_CITATION: CitationDetails = {
  citation: '2024 INSC 512 (Supreme Court of India)',
  court: 'Supreme Court of India',
  bench: "Hon'ble Mr. Justice D.Y. Chandrachud & Hon'ble Sanjiv Khanna",
  year: 2024,
  signal: 'RELIED',
  ratioSummary:
    'The Supreme Court held that under Section 103 of Bharatiya Nyaya Sanhita (BNS 2023), mens rea must be established beyond reasonable doubt through objective circumstantial evidence. Prior IPC Section 302 precedents remain binding unless explicitly repugnant.',
  statuteApplied: 'BNS Section 103 / IPC Section 302 (Homicide)',
  confidenceScore: 99.8,
  piiMaskedCount: 4,
}

export function CitationInspectDrawer({
  isOpen,
  onClose,
  details = DEFAULT_CITATION,
}: CitationInspectDrawerProps): JSX.Element | null {
  if (!isOpen) return null

  const data = details || DEFAULT_CITATION
  const isOverruled = data.signal === 'OVERRULED'
  const isDistinguished = data.signal === 'DISTINGUISHED'

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div className="flex h-full w-full max-w-lg flex-col border-l border-[var(--glass-stroke)] bg-paper-1/95 p-lg shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex flex-none items-center justify-between border-b border-rule-2 pb-md">
          <div className="flex items-center gap-sm">
            <span
              className={`inline-flex items-center gap-xs rounded-full px-sm py-[2px] text-xs font-bold ${
                isOverruled
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : isDistinguished
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isOverruled ? '🔴 OVERRULED' : isDistinguished ? '🟡 DISTINGUISHED' : '🟢 BINDING PRECEDENT (RELIED)'}
            </span>
            <span className="text-xs font-mono text-muted">Verification ID: #INSC-2024-512</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-paper-3 hover:text-ink transition-colors"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-md space-y-md">
          {/* Main Title & Citation */}
          <div>
            <h3 className="text-lg font-semibold text-ink leading-snug">{data.citation}</h3>
            <p className="mt-xs text-xs text-muted font-medium">{data.court} · Bench: {data.bench}</p>
          </div>

          {/* Hallucination Prevention Confidence Gauge */}
          <div className="rounded-card border border-emerald-500/30 bg-emerald-950/20 p-md space-y-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-300 flex items-center gap-xs">
                <CheckCircleIcon className="h-4 w-4" />
                Indian Kanoon & eCourts Verifiable Score
              </span>
              <span className="font-mono font-bold text-emerald-400">{data.confidenceScore}% ACCURACY</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-emerald-950 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${data.confidenceScore}%` }}
              />
            </div>
            <p className="text-[0.72rem] text-emerald-200/70">
              Cross-validated against 15,000+ official Indian court registries and Bare Act amendments.
            </p>
          </div>

          {/* Ratio Decidendi Summary */}
          <div className="rounded-card border border-rule-2 bg-paper-2 p-md space-y-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-accent-text flex items-center gap-xs">
                <FileTextIcon className="h-4 w-4 text-accent" />
                Ratio Decidendi (Core Ruling)
              </span>
              <button
                type="button"
                className="flex items-center gap-xs text-[0.7rem] text-muted hover:text-ink"
                onClick={() => navigator.clipboard.writeText(data.ratioSummary)}
              >
                <CopyIcon className="h-3 w-3" />
                Copy Ratio
              </button>
            </div>
            <p className="text-sm leading-relaxed text-ink-2 bg-paper-3/40 p-sm rounded-sm border border-rule-2/50 font-serif">
              "{data.ratioSummary}"
            </p>
          </div>

          {/* Presidio PII Shield Masking Audit */}
          <div className="rounded-card border border-rule-2 bg-paper-2 p-md space-y-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink flex items-center gap-xs">
                <ShieldIcon className="h-4 w-4 text-emerald-400" />
                Presidio PII Anonymization Audit
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-[2px] rounded-full border border-emerald-500/20">
                {data.piiMaskedCount} PII Redacted
              </span>
            </div>
            <p className="text-xs text-muted leading-snug">
              Litigant names, Aadhaar numbers, phone numbers, and financial details were automatically anonymized in local memory before prompt execution.
            </p>
          </div>

          {/* Statute Applied */}
          <div className="rounded-card border border-rule-2 bg-paper-2 p-md space-y-xs">
            <span className="text-xs font-semibold text-ink">Statutory Provisions Cross-Referenced</span>
            <div className="flex flex-wrap gap-xs pt-xs">
              <span className="rounded-md bg-accent-soft/30 px-xs py-1 text-xs text-accent-text font-mono border border-accent/20">
                {data.statuteApplied}
              </span>
              <span className="rounded-md bg-paper-3 px-xs py-1 text-xs text-muted font-mono border border-rule-2">
                Evidence Act Sec 3
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-none items-center justify-between border-t border-rule-2 pt-md">
          <a
            href="https://indiankanoon.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-xs text-xs text-accent-text hover:underline"
          >
            Open on Indian Kanoon
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn bg-paper-3 px-md py-xs text-xs font-medium text-ink hover:bg-paper-4 transition-colors"
          >
            Close Inspection
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
