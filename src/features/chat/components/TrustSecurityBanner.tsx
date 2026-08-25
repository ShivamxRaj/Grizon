import type { JSX } from 'react'
import { ShieldIcon, CheckCircleIcon, ExternalLinkIcon } from '@/components/ui/icons'

export function TrustSecurityBanner(): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-xs border-b border-[var(--glass-stroke)] bg-paper-2/70 px-md py-xs text-xs backdrop-blur-md transition-all">
      <div className="flex items-center gap-md overflow-x-auto py-[2px] no-scrollbar">
        <div className="flex items-center gap-xs font-semibold text-emerald-400">
          <ShieldIcon className="h-3.5 w-3.5 text-emerald-400" />
          <span>🔒 256-Bit Encrypted Vault</span>
        </div>

        <div className="hidden items-center gap-xs text-muted sm:flex">
          <span className="h-1 w-1 rounded-full bg-emerald-500" />
          <span>Presidio PII Anonymized</span>
        </div>

        <div className="hidden items-center gap-xs text-muted md:flex">
          <span className="h-1 w-1 rounded-full bg-accent-text" />
          <span>15,000+ Indian Courts Live Synced</span>
        </div>

        <div className="flex items-center gap-xs font-medium text-accent-text">
          <CheckCircleIcon className="h-3.5 w-3.5 text-accent" />
          <span>Bar Council Legal Standard Compliant</span>
        </div>
      </div>

      <div className="flex items-center gap-xs text-[0.7rem] font-mono text-muted">
        <span className="rounded-full bg-paper-3 px-2 py-[1px] text-ink-2 font-sans font-medium border border-rule-2">
          Grizon AI Core v3.4 (INSC Certified)
        </span>
      </div>
    </div>
  )
}
