import { describe, expect, it } from 'vitest'
import fs from 'fs'
import {
  getFfmpegPath,
  MediaNormalizerImpl,
  WHISPER_MAX_BYTES,
} from '../MediaNormalizerImpl.js'
import { ChunkedTranscriptItem } from '../../ports/MediaNormalizer.js'

describe('MediaNormalizerImpl', () => {
  const normalizer = new MediaNormalizerImpl()

  it('stitches transcripts with correct time offsets and ordering', () => {
    const chunk1: ChunkedTranscriptItem = {
      startOffsetSec: 0,
      transcript: {
        sourceId: 'src-1',
        segments: [
          { start: 1.0, end: 4.5, text: 'Первая часть записи' },
          { start: 5.0, end: 9.2, text: 'Продолжение первой части' },
        ],
      },
    }

    const chunk2: ChunkedTranscriptItem = {
      startOffsetSec: 600,
      transcript: {
        sourceId: 'src-1',
        segments: [
          { start: 0.5, end: 3.2, text: 'Начало второго часа' },
          { start: 4.0, end: 8.0, text: 'Завершение записи' },
        ],
      },
    }

    const stitched = normalizer.stitchTranscripts([chunk1, chunk2])

    expect(stitched.sourceId).toBe('src-1')
    expect(stitched.segments).toHaveLength(4)
    expect(stitched.segments[0].start).toBe(1.0)
    expect(stitched.segments[0].end).toBe(4.5)
    expect(stitched.segments[0].text).toBe('Первая часть записи')

    expect(stitched.segments[2].start).toBe(600.5)
    expect(stitched.segments[2].end).toBe(603.2)
    expect(stitched.segments[2].text).toBe('Начало второго часа')

    expect(stitched.segments[3].start).toBe(604.0)
    expect(stitched.segments[3].end).toBe(608.0)
  })

  it('sorts interleaved segments chronologically across three chunks', () => {
    const chunk1: ChunkedTranscriptItem = {
      startOffsetSec: 100,
      transcript: {
        segments: [{ start: 5.0, end: 10.0, text: 'Сегмент из чанка 1' }],
      },
    }
    const chunk2: ChunkedTranscriptItem = {
      startOffsetSec: 0,
      transcript: {
        segments: [{ start: 10.0, end: 20.0, text: 'Сегмент из чанка 0' }],
      },
    }
    const chunk3: ChunkedTranscriptItem = {
      startOffsetSec: 50,
      transcript: {
        segments: [{ start: 2.0, end: 8.0, text: 'Сегмент из чанка 2' }],
      },
    }

    const stitched = normalizer.stitchTranscripts([chunk1, chunk2, chunk3])
    expect(stitched.segments[0].text).toBe('Сегмент из чанка 0')
    expect(stitched.segments[0].start).toBe(10.0)
    expect(stitched.segments[1].text).toBe('Сегмент из чанка 2')
    expect(stitched.segments[1].start).toBe(52.0)
    expect(stitched.segments[2].text).toBe('Сегмент из чанка 1')
    expect(stitched.segments[2].start).toBe(105.0)
  })

  it('handles empty chunks gracefully', () => {
    const stitched = normalizer.stitchTranscripts([])
    expect(stitched.segments).toEqual([])
  })

  it('defines whisper max bytes threshold around 24MB', () => {
    expect(WHISPER_MAX_BYTES).toBe(24 * 1024 * 1024)
  })

  it('locates valid ffmpeg static binary file on disk', () => {
    const resolvedPath = getFfmpegPath()
    expect(resolvedPath).toBeTruthy()
    expect(fs.existsSync(resolvedPath)).toBe(true)
  })

  it('fails with clear russian message when binary path is invalid', () => {
    const originalEnv = process.env.FFMPEG_PATH
    try {
      process.env.FFMPEG_PATH = '/path/to/nonexistent/ffmpeg'
      expect(() => getFfmpegPath()).toThrow('Утилита FFmpeg недоступна')
    } finally {
      process.env.FFMPEG_PATH = originalEnv
    }
  })
})
