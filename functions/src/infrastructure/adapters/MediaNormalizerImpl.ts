import { spawn } from 'child_process'
import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'
import { Transcript, TranscriptSegment } from '../../domain/types.js'
import {
  AudioChunk,
  ChunkedTranscriptItem,
  MediaNormalizer,
} from '../ports/MediaNormalizer.js'

export const WHISPER_MAX_BYTES = 24 * 1024 * 1024

export const getFfmpegPath = (): string => {
  if (process.env.FFMPEG_PATH) {
    if (fs.existsSync(process.env.FFMPEG_PATH)) {
      return process.env.FFMPEG_PATH
    }
    throw new Error(`Утилита FFmpeg недоступна по пути "${process.env.FFMPEG_PATH}". Проверьте конфигурацию среды.`)
  }
  if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
    return ffmpegInstaller.path
  }
  throw new Error('Утилита FFmpeg недоступна для обработки медиа. Проверьте конфигурацию среды.')
}

export const getFfprobePath = (): string => {
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    return process.env.FFPROBE_PATH
  }
  if (ffprobeInstaller && ffprobeInstaller.path && fs.existsSync(ffprobeInstaller.path)) {
    return ffprobeInstaller.path
  }
  return ''
}

const executeCommand = (
  command: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args)
    let stdout = ''
    let stderr = ''

    process.stdout?.on('data', (data) => {
      stdout += data.toString()
    })
    process.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(
          new Error(
            `Ошибка обработки медиа (FFmpeg код ${code}): ${stderr || stdout || 'неизвестная ошибка'}`
          )
        )
      }
    })

    process.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        reject(
          new Error(
            `Утилита FFmpeg не найдена по пути "${command}". Проверьте конфигурацию среды.`
          )
        )
      } else {
        reject(err)
      }
    })
  })
}

export class MediaNormalizerImpl implements MediaNormalizer {
  async getAudioDuration(filePath: string): Promise<number> {
    const probePath = getFfprobePath()
    if (probePath) {
      try {
        const { stdout } = await executeCommand(probePath, [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'default=noprint_wrappers=1:nokey=1',
          filePath,
        ])
        const parsed = parseFloat(stdout.trim())
        if (!isNaN(parsed) && parsed > 0) {
          return parsed
        }
      } catch {
        void 0
      }
    }

    try {
      const ffmpegPath = getFfmpegPath()
      const { stderr } = await executeCommand(ffmpegPath, ['-i', filePath])
      const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/)
      if (match) {
        const hours = parseInt(match[1], 10)
        const minutes = parseInt(match[2], 10)
        const seconds = parseFloat(match[3])
        return hours * 3600 + minutes * 60 + seconds
      }
    } catch {
      void 0
    }

    return 0
  }

  async extractAudio(
    videoFilePath: string,
    outputAudioPath: string
  ): Promise<string> {
    const ffmpegPath = getFfmpegPath()
    await executeCommand(ffmpegPath, [
      '-y',
      '-i',
      videoFilePath,
      '-vn',
      '-acodec',
      'libmp3lame',
      '-q:a',
      '2',
      outputAudioPath,
    ])
    return outputAudioPath
  }

  async convertToMp3(
    inputAudioPath: string,
    outputAudioPath: string
  ): Promise<string> {
    const ffmpegPath = getFfmpegPath()
    await executeCommand(ffmpegPath, [
      '-y',
      '-i',
      inputAudioPath,
      '-vn',
      '-acodec',
      'libmp3lame',
      '-q:a',
      '2',
      outputAudioPath,
    ])
    return outputAudioPath
  }

  async chunkAudio(
    audioFilePath: string,
    maxChunkBytes = WHISPER_MAX_BYTES
  ): Promise<AudioChunk[]> {
    const stats = await fsp.stat(audioFilePath)
    const fileSize = stats.size

    const totalDuration = await this.getAudioDuration(audioFilePath)

    if (fileSize <= maxChunkBytes) {
      return [
        {
          filePath: audioFilePath,
          startOffsetSec: 0,
          durationSec: totalDuration,
        },
      ]
    }

    const chunkCount = Math.ceil(fileSize / (maxChunkBytes * 0.85))
    const ext = path.extname(audioFilePath)
    const baseName = path.basename(audioFilePath, ext)
    const dir = path.dirname(audioFilePath)

    const chunks: AudioChunk[] = []
    const chunkDuration = totalDuration > 0 ? totalDuration / chunkCount : 600

    const ffmpegPath = getFfmpegPath()

    for (let i = 0; i < chunkCount; i++) {
      const chunkPath = path.join(dir, `${baseName}-chunk-${i}${ext}`)
      const startOffset = i * chunkDuration
      const currentDuration =
        totalDuration > 0
          ? i === chunkCount - 1
            ? Math.max(0, totalDuration - startOffset)
            : chunkDuration
          : chunkDuration

      await executeCommand(ffmpegPath, [
        '-y',
        '-ss',
        startOffset.toFixed(2),
        '-i',
        audioFilePath,
        '-t',
        currentDuration.toFixed(2),
        '-acodec',
        'copy',
        chunkPath,
      ])

      chunks.push({
        filePath: chunkPath,
        startOffsetSec: Number(startOffset.toFixed(2)),
        durationSec: Number(currentDuration.toFixed(2)),
      })
    }

    return chunks
  }

  stitchTranscripts(items: ChunkedTranscriptItem[]): Transcript {
    const allSegments: TranscriptSegment[] = []
    let sourceId: string | undefined

    for (const item of items) {
      if (!sourceId && item.transcript.sourceId) {
        sourceId = item.transcript.sourceId
      }
      const offset = item.startOffsetSec || 0
      for (const seg of item.transcript.segments) {
        allSegments.push({
          ...seg,
          start: Number((seg.start + offset).toFixed(2)),
          end: Number((seg.end + offset).toFixed(2)),
        })
      }
    }

    allSegments.sort((a, b) => a.start - b.start)

    return {
      ...(sourceId ? { sourceId } : {}),
      segments: allSegments,
    }
  }
}
