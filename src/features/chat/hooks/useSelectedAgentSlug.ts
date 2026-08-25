import { useCallback, useState } from 'react'
import { readSelectedAgentSlug, writeSelectedAgentSlug } from '../lib/selectedAgentSlug'

export interface UseSelectedAgentSlugResult {
  selectedAgentSlug: string | null
  setSelectedAgentSlug: (slug: string | null) => void
}

export function useSelectedAgentSlug(): UseSelectedAgentSlugResult {
  const [selectedAgentSlug, setState] = useState<string | null>(() => readSelectedAgentSlug())

  const setSelectedAgentSlug = useCallback((slug: string | null): void => {
    writeSelectedAgentSlug(slug)
    setState(slug)
  }, [])

  return { selectedAgentSlug, setSelectedAgentSlug }
}
