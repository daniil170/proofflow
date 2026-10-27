import { promises as fs } from 'fs'
import path from 'path'
import { Source } from '../../domain/types.js'
import { AudioChunk, MediaNormalizer } from '../../infrastructure/ports/MediaNormalizer.js'
import { StoragePort } from '../../infrastructure/ports/StoragePort.js'

export interface NormalizedSourceResult {
  source: Source
  localFilePath: string
  audioChunks?: AudioChunk[]
}

export interface NormalizeSourcesOutput {
  screenshots: NormalizedSourceResult[]
  audios: NormalizedSourceResult[]
}

export interface NormalizeSourcesInput {
  sources: Source[]
  storage: StoragePort
  normalizer: MediaNormalizer
  workDir: string
}

export const normalizeSources = async ({
  sources,
  storage,
  normalizer,
  workDir,
}: NormalizeSourcesInput): Promise<NormalizeSourcesOutput> => {
  await fs.mkdir(workDir, { recursive: true })

  const sortedSources = [...sources].sort((a, b) => a.order - b.order)
  const screenshots: NormalizedSourceResult[] = []
  const audios: NormalizedSourceResult[] = []

  for (const src of sortedSources) {
    const rawExt = path.extname(src.storagePath)
    const fallbackExt =
      src.kind === 'screenshot'
        ? '.png'
        : src.kind === 'video'
        ? '.mp4'
        : '.mp3'
    const ext = rawExt || fallbackExt
    const localTarget = path.join(workDir, `${src.id}${ext}`)

    await storage.downloadFile(src.storagePath, localTarget)

    if (src.kind === 'video') {
      const audioDestination = path.join(workDir, `${src.id}-extracted.mp3`)
      const audioPath = await normalizer.extractAudio(localTarget, audioDestination)
      const chunks = await normalizer.chunkAudio(audioPath)
      audios.push({
        source: src,
        localFilePath: audioPath,
        audioChunks: chunks,
      })
    } else if (src.kind === 'audio' || src.kind === 'voice') {
      const isMp3 = ext.toLowerCase() === '.mp3'
      let finalAudioPath = localTarget
      if (!isMp3) {
        const audioDestination = path.join(workDir, `${src.id}-converted.mp3`)
        finalAudioPath = await normalizer.convertToMp3(localTarget, audioDestination)
      }
      const chunks = await normalizer.chunkAudio(finalAudioPath)
      audios.push({
        source: src,
        localFilePath: finalAudioPath,
        audioChunks: chunks,
      })
    } else if (src.kind === 'screenshot') {
      screenshots.push({
        source: src,
        localFilePath: localTarget,
      })
    }
  }

  return { screenshots, audios }
}
