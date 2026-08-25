export const RESPONSE_STYLES = [
  { value: 'default', label: 'Default', sample: 'Here are three options, with the trade-offs for each.' },
  { value: 'concise', label: 'Concise', sample: 'Three options. Pick B — cheapest, ships fastest.' },
  { value: 'detailed', label: 'Detailed', sample: 'There are three viable options. Starting with the first, the trade-off is…' },
  { value: 'formal', label: 'Formal', sample: 'Please find three options below, each assessed against your stated criteria.' },
  { value: 'friendly', label: 'Friendly', sample: 'Good question — I found three ways to do this. Want me to walk through them?' },
  { value: 'technical', label: 'Technical', sample: 'Three approaches. B has O(n) lookup and no extra dependency; prefer it.' },
]

export const STYLE_TRAITS = [
  'Use examples',
  'Show your reasoning',
  'Skip the preamble',
  'Suggest next steps',
  'Cite sources',
  'Use bullet points',
]

export const DEFAULT_INSTRUCTIONS =
  'Answer in British English. Lead with the recommendation, then the reasoning. Flag anything you are unsure about instead of guessing.'

export const OCCUPATION_OPTIONS = [
  { value: 'unset', label: 'Prefer not to say' },
  { value: 'engineer', label: 'Software engineer' },
  { value: 'designer', label: 'Designer' },
  { value: 'product', label: 'Product manager' },
  { value: 'founder', label: 'Founder or operator' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance or analyst' },
  { value: 'research', label: 'Researcher' },
  { value: 'writer', label: 'Writer or editor' },
  { value: 'student', label: 'Student' },
  { value: 'other', label: 'Other' },
]

/**
 * Which agents each plan includes. The Agents group lists only the entitled
 * ones, so the picker can never offer something the plan can't run.
 */
export const AGENT_IDS_BY_PLAN: Record<string, string[]> = {
  Free: ['auto', 'general'],
  Plus: ['auto', 'general', 'trading-analyst', 'coding-expert'],
  Pro: ['auto', 'general', 'trading-analyst', 'coding-expert'],
}
