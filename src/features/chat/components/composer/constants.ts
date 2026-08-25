/** Composer / upload limits aligned with backend allowlist. */

/** Text area grows up to this many lines, then scrolls internally. */
export const MAX_TEXTAREA_ROWS = 6

/** Files larger than this surface the chip's error state (plan may be stricter). */
export const MAX_FILE_BYTES = 25 * 1024 * 1024

/** Poll interval while waiting for file processing. */
export const FILE_POLL_INTERVAL_MS = 800

/** Give up polling after this many attempts. */
export const FILE_POLL_MAX_ATTEMPTS = 60

/** `accept` attribute — matches backend fileController allowlist. */
export const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
  'video/mp4',
  'video/webm',
  'video/mpeg',
  'video/quicktime',
  '.pdf',
  '.docx',
  '.xlsx',
  '.csv',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.mp4',
  '.webm',
].join(',')

export const ALLOWED_UPLOAD_MIME_TYPES: ReadonlySet<string> = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
  'video/mp4',
  'video/webm',
  'video/mpeg',
  'video/mov',
  'video/avi',
  'video/x-flv',
  'video/mpg',
  'video/wmv',
  'video/3gpp',
  'video/quicktime',
])
