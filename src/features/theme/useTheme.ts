import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'
export type ThemeMode = 'system' | Theme

const THEME_STORAGE_KEY = 'grizon-theme-mode'
const THEME_CHANGE_EVENT = 'grizon-theme-change'
const SYSTEM_QUERY = '(prefers-color-scheme: dark)'

function systemPref(): Theme {
  return window.matchMedia(SYSTEM_QUERY).matches ? 'dark' : 'light'
}

function getMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function resolveMode(mode: ThemeMode): Theme {
  return mode === 'system' ? systemPref() : mode
}

function getTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

function applyMode(mode: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', resolveMode(mode))
  localStorage.setItem(THEME_STORAGE_KEY, mode)
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(SYSTEM_QUERY)
  const onMqChange = (): void => {
    if (getMode() === 'system') applyMode('system')
  }
  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  mq.addEventListener('change', onMqChange)
  return (): void => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange)
    mq.removeEventListener('change', onMqChange)
  }
}

// Shared store via `data-theme` + localStorage so topbar and settings stay in sync.
export function useTheme(): {
  theme: Theme
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleTheme: () => void
} {
  const theme = useSyncExternalStore(subscribe, getTheme)
  const mode = useSyncExternalStore(subscribe, getMode)

  const setMode = useCallback((next: ThemeMode): void => {
    applyMode(next)
  }, [])

  const toggleTheme = useCallback((): void => {
    applyMode(theme === 'dark' ? 'light' : 'dark')
  }, [theme])

  return { theme, mode, setMode, toggleTheme }
}
