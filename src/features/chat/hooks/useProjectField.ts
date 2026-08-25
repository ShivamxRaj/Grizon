import { useState } from 'react'

const STORAGE_PREFIX = 'grizon-project-field'

function storageKey(projectId: string, field: string): string {
  return `${STORAGE_PREFIX}:${projectId}:${field}`
}

function readStored(projectId: string, field: string, fallback: string): string {
  const stored = localStorage.getItem(storageKey(projectId, field))
  return stored ?? fallback
}

/** Persists a single editable project field (instructions, memory, ...) to localStorage, seeded from the given default. */
export function useProjectField(projectId: string, field: string, defaultValue: string): [string, (next: string) => void] {
  const [value, setValue] = useState(() => readStored(projectId, field, defaultValue))

  const update = (next: string): void => {
    setValue(next)
    localStorage.setItem(storageKey(projectId, field), next)
  }

  return [value, update]
}
