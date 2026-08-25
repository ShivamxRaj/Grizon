const STORAGE_KEY = 'grizon.selected_agent_slug'
const AUTO_SENTINEL = 'auto'

export function readSelectedAgentSlug(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null || raw === '' || raw === AUTO_SENTINEL) return null
    return raw
  } catch {
    return null
  }
}

export function writeSelectedAgentSlug(slug: string | null): void {
  try {
    if (slug === null || slug === AUTO_SENTINEL) {
      localStorage.setItem(STORAGE_KEY, AUTO_SENTINEL)
      return
    }
    localStorage.setItem(STORAGE_KEY, slug)
  } catch {
    // Ignore quota / private-mode failures — selection still works in-memory.
  }
}
