import { useState } from 'react'

export function useExpandable(): { expanded: boolean; toggle: () => void } {
  const [expanded, setExpanded] = useState(false)
  return { expanded, toggle: () => setExpanded((value) => !value) }
}
