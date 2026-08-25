import { useCallback, useState } from 'react'

export type ToggleSet = Record<string, boolean>

interface ToggleSetApi {
  values: ToggleSet
  set: (id: string, next: boolean) => void
}

/** Holds a group of independent switches (notifications, agent visibility) in one object. */
export function useToggleSet(initial: ToggleSet): ToggleSetApi {
  const [values, setValues] = useState<ToggleSet>(initial)

  const set = useCallback((id: string, next: boolean): void => {
    setValues((current) => ({ ...current, [id]: next }))
  }, [])

  return { values, set }
}
