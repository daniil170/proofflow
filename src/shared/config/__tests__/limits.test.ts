import { describe, expect, it } from 'vitest'
import {
  ALLOWED_MIME_TYPES,
  DEFAULT_ALLOWED_AUDIO_MIME_TYPES,
  DEFAULT_ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_ALLOWED_VIDEO_MIME_TYPES,
  DEFAULT_ALLOWED_VOICE_MIME_TYPES,
  getCaseLimits,
  isAllowedMimeType,
  MAX_CASES_PER_ACCOUNT,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_CASE,
  MAX_RECORDING_DURATION_SEC,
} from '../limits.ts'

describe('limits configuration', () => {
  it('has safe default limit numbers', () => {
    expect(MAX_CASES_PER_ACCOUNT).toBeGreaterThanOrEqual(20)
    expect(MAX_FILES_PER_CASE).toBeGreaterThanOrEqual(5)
    expect(MAX_FILE_SIZE_BYTES).toBeGreaterThanOrEqual(10 * 1024 * 1024)
    expect(MAX_RECORDING_DURATION_SEC).toBeGreaterThanOrEqual(3600)
  })

  it('includes image, audio, video, and voice mime types by default', () => {
    expect(DEFAULT_ALLOWED_IMAGE_MIME_TYPES).toContain('image/png')
    expect(DEFAULT_ALLOWED_IMAGE_MIME_TYPES).toContain('image/jpeg')

    expect(DEFAULT_ALLOWED_AUDIO_MIME_TYPES).toContain('audio/mpeg')
    expect(DEFAULT_ALLOWED_AUDIO_MIME_TYPES).toContain('audio/wav')

    expect(DEFAULT_ALLOWED_VIDEO_MIME_TYPES).toContain('video/mp4')
    expect(DEFAULT_ALLOWED_VIDEO_MIME_TYPES).toContain('video/webm')

    expect(DEFAULT_ALLOWED_VOICE_MIME_TYPES).toContain('audio/ogg')
  })

  it('validates allowed mime types accurately', () => {
    expect(isAllowedMimeType('image/png')).toBe(true)
    expect(isAllowedMimeType('IMAGE/PNG')).toBe(true)
    expect(isAllowedMimeType('audio/mpeg')).toBe(true)
    expect(isAllowedMimeType('video/mp4')).toBe(true)

    expect(isAllowedMimeType('application/x-executable')).toBe(false)
    expect(isAllowedMimeType('text/html')).toBe(false)
    expect(isAllowedMimeType('application/zip')).toBe(false)
  })

  it('getCaseLimits returns a complete limits snapshot', () => {
    const limits = getCaseLimits()
    expect(limits.maxCasesPerAccount).toBe(MAX_CASES_PER_ACCOUNT)
    expect(limits.maxFilesPerCase).toBe(MAX_FILES_PER_CASE)
    expect(limits.maxFileSizeBytes).toBe(MAX_FILE_SIZE_BYTES)
    expect(limits.maxRecordingDurationSec).toBe(MAX_RECORDING_DURATION_SEC)
    expect(limits.allowedMimeTypes.length).toBeGreaterThan(0)
  })
})
