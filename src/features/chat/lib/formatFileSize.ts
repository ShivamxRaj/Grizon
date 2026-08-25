const BYTES_PER_UNIT = 1024
const UNITS = ['B', 'KB', 'MB', 'GB'] as const

/** Human-readable file size, e.g. 1_258_291 → "1.2 MB". Presentational only. */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT)), UNITS.length - 1)
  const value = bytes / BYTES_PER_UNIT ** exponent
  const rounded = exponent === 0 ? value : Math.round(value * 10) / 10
  return `${rounded} ${UNITS[exponent]}`
}
