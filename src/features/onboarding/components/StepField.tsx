import type { JSX, ReactNode } from 'react'

interface StepFieldProps {
  label: string
  /** Only when the label alone can't carry the rule — never a restatement. */
  hint?: string
  children: ReactNode
}

/** Field label styling is lifted from SettingsGroup so both surfaces read as one system. */
export function StepField({ label, hint, children }: StepFieldProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2xs">
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">{label}</span>
      {hint && <p className="settings-wrap -mt-3xs text-sm leading-relaxed text-muted">{hint}</p>}
      {children}
    </div>
  )
}
