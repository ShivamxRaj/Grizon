export interface SavedMemory {
  id: string
  text: string
  sourceChat: string
  savedAt: string
}

export const SAVED_MEMORIES: SavedMemory[] = [
  {
    id: 'mem-stack',
    text: 'Works in React and TypeScript, and prefers explicit return types on every function.',
    sourceChat: 'Sidebar hover states',
    savedAt: '18 Jul 2026',
  },
  {
    id: 'mem-tone',
    text: 'Prefers short answers with the recommendation first, and dislikes hedging.',
    sourceChat: 'Pricing page copy',
    savedAt: '11 Jul 2026',
  },
  {
    id: 'mem-tz',
    text: 'Based in Mumbai — schedule suggestions should assume IST working hours.',
    sourceChat: 'Q3 launch timeline',
    savedAt: '2 Jul 2026',
  },
  {
    id: 'mem-design',
    text: 'Runs a strict design-token system; never wants hardcoded colours or sizes in generated code.',
    sourceChat: 'Grizon Web App · tokens',
    savedAt: '24 Jun 2026',
  },
]

export const MEMORY_EMPTY_COPY =
  'Memories are short facts Grizon saves when you tell it something worth remembering — your role, your preferences, how you like answers written. They carry across every chat. Nothing is saved yet.'
