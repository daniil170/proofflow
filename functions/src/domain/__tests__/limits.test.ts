import { describe, expect, it } from 'vitest'
import {
  ALLOWED_SOURCE_MIME_TYPES,
  MAX_CASES_PER_ACCOUNT,
  MAX_FILES_PER_CASE,
  STORAGE_RETENTION_DAYS,
  validateCaseFileParameters,
} from '../limits.js'
import { Source } from '../types.js'

describe('server limits and validation', () => {
  it('exposes positive default limits', () => {
    expect(MAX_CASES_PER_ACCOUNT).toBeGreaterThan(0)
    expect(MAX_FILES_PER_CASE).toBeGreaterThan(0)
    expect(STORAGE_RETENTION_DAYS).toBeGreaterThanOrEqual(7)
    expect(ALLOWED_SOURCE_MIME_TYPES.length).toBeGreaterThan(0)
  })

  it('rejects empty sources list', () => {
    const res = validateCaseFileParameters([])
    expect(res.isValid).toBe(false)
    expect(res.reason).toContain('хотя бы один файл')
  })

  it('rejects sources exceeding maxFiles', () => {
    const sources: Source[] = Array.from({ length: 12 }, (_, i) => ({
      id: `src-${i}`,
      kind: 'screenshot',
      storagePath: `cases/c1/src-${i}.png`,
      mimeType: 'image/png',
      order: i,
    }))
    const res = validateCaseFileParameters(sources, 10)
    expect(res.isValid).toBe(false)
    expect(res.reason).toContain('Превышен лимит файлов')
  })

  it('rejects invalid mime types', () => {
    const sources: Source[] = [
      {
        id: 's1',
        kind: 'screenshot',
        storagePath: 'cases/c1/file.exe',
        mimeType: 'application/x-msdownload',
        order: 0,
      },
    ]
    const res = validateCaseFileParameters(sources)
    expect(res.isValid).toBe(false)
    expect(res.reason).toContain('Недопустимый формат')
  })

  it('accepts valid sources', () => {
    const sources: Source[] = [
      {
        id: 's1',
        kind: 'screenshot',
        storagePath: 'cases/c1/chat.png',
        mimeType: 'image/png',
        order: 0,
      },
      {
        id: 's2',
        kind: 'audio',
        storagePath: 'cases/c1/call.mp3',
        mimeType: 'audio/mpeg',
        order: 1,
      },
    ]
    const res = validateCaseFileParameters(sources)
    expect(res.isValid).toBe(true)
  })
})
