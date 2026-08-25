import type { JSX } from 'react'

interface SettingsPointerProps {
  /** What this flow deliberately skipped, and where it lives instead. */
  hint: string
}

/**
 * The honest counterweight to a three-step flow: it names what was left out
 * rather than pretending setup is finished. Informational only — the flow has
 * no exit but finishing it.
 */
export function SettingsPointer({ hint }: SettingsPointerProps): JSX.Element {
  return (
    <p className="settings-wrap border-l-2 border-accent/40 py-3xs pl-xs text-sm leading-relaxed text-muted">
      {hint}.
    </p>
  )
}
