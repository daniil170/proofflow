import { Transcript } from '../../domain/types.js'

export interface AudioChunk {
  filePath: string
  startOffsetSec: number
  durationSec: number
}

export interface ChunkedTranscriptItem {
  transcript: Transcript
  startOffsetSec: number
}

export interface MediaNormalizer {
  extractAudio(videoFilePath: string, outputAudioPath: string): Promise<string>
  chunkAudio(audioFilePath: string, maxChunkBytes?: number): Promise<AudioChunk[]>
  stitchTranscripts(items: ChunkedTranscriptItem[]): Transcript
}
