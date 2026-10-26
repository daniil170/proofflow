import { Transcript } from '../../domain/types.js'
import {
  ChunkedTranscriptItem,
  MediaNormalizer,
} from '../../infrastructure/ports/MediaNormalizer.js'
import { Transcriber } from '../../infrastructure/ports/Transcriber.js'
import { NormalizedSourceResult } from './normalizeSources.js'

export interface TranscribeAudioInput {
  audios: NormalizedSourceResult[]
  transcriber: Transcriber
  normalizer: MediaNormalizer
  language?: string
}

export const transcribeAudio = async ({
  audios,
  transcriber,
  normalizer,
  language,
}: TranscribeAudioInput): Promise<Transcript[]> => {
  const transcripts: Transcript[] = []

  for (const audio of audios) {
    const chunks = audio.audioChunks || []

    if (chunks.length > 1) {
      const chunkItems: ChunkedTranscriptItem[] = []

      for (const chunk of chunks) {
        const chunkTranscript = await transcriber.transcribe(chunk.filePath, {
          language,
        })
        chunkItems.push({
          transcript: chunkTranscript,
          startOffsetSec: chunk.startOffsetSec,
        })
      }

      const stitched = normalizer.stitchTranscripts(chunkItems)
      const enrichedSegments = stitched.segments.map((seg, idx) => ({
        ...seg,
        id: seg.id || `${audio.source.id}-seg-${idx}`,
        sourceId: audio.source.id,
      }))

      transcripts.push({
        sourceId: audio.source.id,
        segments: enrichedSegments,
      })
    } else {
      const rawTranscript = await transcriber.transcribe(audio.localFilePath, {
        language,
      })
      const enrichedSegments = rawTranscript.segments.map((seg, idx) => ({
        ...seg,
        id: seg.id || `${audio.source.id}-seg-${idx}`,
      }))

      transcripts.push({
        sourceId: audio.source.id,
        segments: enrichedSegments,
      })
    }
  }

  return transcripts
}
