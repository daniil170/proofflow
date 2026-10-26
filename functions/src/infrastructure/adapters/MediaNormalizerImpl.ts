import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { Transcript, TranscriptSegment } from '../../domain/types.js'
import {
  AudioChunk,
  ChunkedTranscriptItem,
  MediaNormalizer,
} from '../ports/MediaNormalizer.js'

export const WHISPER_MAX_BYTES = 24 * 1024 * 1024

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
        reject(new Error(`Command ${command} failed (${code}): ${stderr}`))
      }
    })

    process.on('error', (err) => {
      reject(err)
    })
  })
}

export class MediaNormalizerImpl implements MediaNormalizer {
  async extractAudio(
    videoFilePath: string,
    outputAudioPath: string
  ): Promise<string> {
    try {
      await executeCommand('ffmpeg', [
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
    } catch {
      return videoFilePath
    }
  }

  async chunkAudio(
    audioFilePath: string,
    maxChunkBytes = WHISPER_MAX_BYTES
  ): Promise<AudioChunk[]> {
    const stats = await fs.stat(audioFilePath)
    const fileSize = stats.size

    if (fileSize <= maxChunkBytes) {
      return [
        {
          filePath: audioFilePath,
          startOffsetSec: 0,
          durationSec: 0,
        },
      ]
    }

    const chunkCount = Math.ceil(fileSize / maxChunkBytes)
    const ext = path.extname(audioFilePath)
    const baseName = path.basename(audioFilePath, ext)
    const dir = path.dirname(audioFilePath)

    const chunks: AudioChunk[] = []
    const estimatedChunkDurationSec = 600

    for (let i = 0; i < chunkCount; i++) {
      const chunkPath = path.join(dir, `${baseName}-chunk-${i}${ext}`)
      const startOffset = i * estimatedChunkDurationSec

      try {
        await executeCommand('ffmpeg', [
          '-y',
          '-ss',
          startOffset.toString(),
          '-i',
          audioFilePath,
          '-t',
          estimatedChunkDurationSec.toString(),
          '-c',
          'copy',
          chunkPath,
        ])
        chunks.push({
          filePath: chunkPath,
          startOffsetSec: startOffset,
          durationSec: estimatedChunkDurationSec,
        })
      } catch {
        chunks.push({
          filePath: audioFilePath,
          startOffsetSec: startOffset,
          durationSec: estimatedChunkDurationSec,
        })
        break
      }
    }

    return chunks
  }

  stitchTranscripts(items: ChunkedTranscriptItem[]): Transcript {
    const allSegments: TranscriptSegment[] = []

    for (const item of items) {
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
      segments: allSegments,
    }
  }
}
