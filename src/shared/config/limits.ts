const getEnvValue = (key: string): string | undefined => {
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env[key] === 'string'
  ) {
    return import.meta.env[key]
  }
  if (typeof process !== 'undefined' && process.env && typeof process.env[key] === 'string') {
    return process.env[key]
  }
  return undefined
}

const parseNumber = (key: string, fallback: number): number => {
  const raw = getEnvValue(key)
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const parseList = (key: string, fallback: readonly string[]): readonly string[] => {
  const raw = getEnvValue(key)
  if (!raw) return fallback
  const items = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return items.length > 0 ? Object.freeze(items) : fallback
}

export const DEFAULT_ALLOWED_IMAGE_MIME_TYPES = Object.freeze([
  'image/png',
  'image/jpeg',
  'image/webp',
])

export const DEFAULT_ALLOWED_AUDIO_MIME_TYPES = Object.freeze([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
])

export const DEFAULT_ALLOWED_VIDEO_MIME_TYPES = Object.freeze([
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

export const DEFAULT_ALLOWED_VOICE_MIME_TYPES = Object.freeze([
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/wav',
])

export const DEFAULT_ALLOWED_MIME_TYPES = Object.freeze([
  ...DEFAULT_ALLOWED_IMAGE_MIME_TYPES,
  ...DEFAULT_ALLOWED_AUDIO_MIME_TYPES,
  ...DEFAULT_ALLOWED_VIDEO_MIME_TYPES,
])

export const MAX_CASES_PER_ACCOUNT = parseNumber('VITE_MAX_CASES_PER_ACCOUNT', 50)
export const MAX_FILES_PER_CASE = parseNumber('VITE_MAX_FILES_PER_CASE', 10)
export const MAX_FILE_SIZE_BYTES = parseNumber('VITE_MAX_FILE_SIZE_BYTES', 100 * 1024 * 1024)
export const MAX_RECORDING_DURATION_SEC = parseNumber('VITE_MAX_RECORDING_DURATION_SEC', 7200)
export const STORAGE_RETENTION_DAYS = parseNumber('VITE_STORAGE_RETENTION_DAYS', 14)
export const SUPPORT_TELEGRAM_URL = getEnvValue('VITE_TELEGRAM_SUPPORT_URL') || 'https://t.me/proofflowbot'

export const ALLOWED_MIME_TYPES = parseList('VITE_ALLOWED_MIME_TYPES', DEFAULT_ALLOWED_MIME_TYPES)

export interface CaseLimits {
  readonly maxCasesPerAccount: number
  readonly maxFilesPerCase: number
  readonly maxFileSizeBytes: number
  readonly maxRecordingDurationSec: number
  readonly storageRetentionDays: number
  readonly allowedMimeTypes: readonly string[]
  readonly supportUrl: string
}

export const getCaseLimits = (): CaseLimits => ({
  maxCasesPerAccount: parseNumber('VITE_MAX_CASES_PER_ACCOUNT', 50),
  maxFilesPerCase: parseNumber('VITE_MAX_FILES_PER_CASE', 10),
  maxFileSizeBytes: parseNumber('VITE_MAX_FILE_SIZE_BYTES', 100 * 1024 * 1024),
  maxRecordingDurationSec: parseNumber('VITE_MAX_RECORDING_DURATION_SEC', 7200),
  storageRetentionDays: parseNumber('VITE_STORAGE_RETENTION_DAYS', 14),
  allowedMimeTypes: parseList('VITE_ALLOWED_MIME_TYPES', DEFAULT_ALLOWED_MIME_TYPES),
  supportUrl: getEnvValue('VITE_TELEGRAM_SUPPORT_URL') || 'https://t.me/proofflowbot',
})

export const formatRemainingCases = (remaining: number): string => {
  if (remaining <= 0) {
    return 'Лимит исчерпан'
  }
  const rem10 = remaining % 10
  const rem100 = remaining % 100
  if (rem10 === 1 && rem100 !== 11) {
    return `остался ${remaining} кейс`
  }
  if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 >= 20)) {
    return `осталось ${remaining} кейса`
  }
  return `осталось ${remaining} кейсов`
}

export const isAllowedMimeType = (
  mimeType: string,
  allowedList: readonly string[] = ALLOWED_MIME_TYPES
): boolean => allowedList.includes(mimeType.toLowerCase())
