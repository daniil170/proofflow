import { Source } from './types.js'

export const MAX_CASES_PER_ACCOUNT =
  Number(process.env.MAX_CASES_PER_ACCOUNT) > 0
    ? Number(process.env.MAX_CASES_PER_ACCOUNT)
    : 50

export const MAX_FILES_PER_CASE =
  Number(process.env.MAX_FILES_PER_CASE) > 0
    ? Number(process.env.MAX_FILES_PER_CASE)
    : 10

export const MAX_FILE_SIZE_BYTES =
  Number(process.env.MAX_FILE_SIZE_BYTES) > 0
    ? Number(process.env.MAX_FILE_SIZE_BYTES)
    : 100 * 1024 * 1024

export const MAX_RECORDING_DURATION_SEC =
  Number(process.env.MAX_RECORDING_DURATION_SEC) > 0
    ? Number(process.env.MAX_RECORDING_DURATION_SEC)
    : 3600

export const STORAGE_RETENTION_DAYS =
  Number(process.env.STORAGE_RETENTION_DAYS) > 0
    ? Number(process.env.STORAGE_RETENTION_DAYS)
    : 14

export const ALLOWED_SOURCE_MIME_TYPES = Object.freeze([
  'image/png',
  'image/jpeg',
  'image/webp',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

export interface ValidationResult {
  readonly isValid: boolean
  readonly reason?: string
}

export const validateCaseFileParameters = (
  sources: readonly Source[],
  maxFiles = MAX_FILES_PER_CASE,
  maxDuration = MAX_RECORDING_DURATION_SEC
): ValidationResult => {
  if (!sources || sources.length === 0) {
    return {
      isValid: false,
      reason: 'В кейсе должен быть хотя бы один файл источника',
    }
  }

  if (sources.length > maxFiles) {
    return {
      isValid: false,
      reason: `Превышен лимит файлов на кейс (максимум ${maxFiles}, получено ${sources.length})`,
    }
  }

  for (const src of sources) {
    if (!src.mimeType) {
      return {
        isValid: false,
        reason: 'У одного из файлов не указан mimeType',
      }
    }
    const lower = src.mimeType.toLowerCase()
    if (!ALLOWED_SOURCE_MIME_TYPES.includes(lower)) {
      return {
        isValid: false,
        reason: `Недопустимый формат файла: ${src.mimeType}`,
      }
    }
    if (src.durationSec && src.durationSec > maxDuration) {
      return {
        isValid: false,
        reason: `Длительность записи превышает допустимый лимит (${Math.round(maxDuration / 60)} мин)`,
      }
    }
  }

  return { isValid: true }
}
