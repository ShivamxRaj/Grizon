import type { CSSProperties } from 'react'
import type { ProjectTint } from '../../data/projects'

const TINT_VAR: Record<ProjectTint, string> = {
  accent: 'var(--color-accent)',
  cool: 'var(--color-accent-cool)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
}

/** Icon color + soft tinted background for a project badge, driven by theme tokens. */
export function tintStyle(tint: ProjectTint): CSSProperties {
  const hue = TINT_VAR[tint]
  return { color: hue, background: `color-mix(in oklch, ${hue} 15%, transparent)` }
}
