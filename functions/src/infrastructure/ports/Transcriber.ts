import { Transcript } from '../../domain/types.js'

export interface TranscribeOptions {
  language?: string
  prompt?: string
}

export interface Transcriber {
  transcribe(audioFilePath: string, options?: TranscribeOptions): Promise<Transcript>
}
