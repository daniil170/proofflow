import { promises as fs } from 'fs'
import path from 'path'
import { Transcript } from '../../domain/types.js'
import { TranscribeOptions, Transcriber } from '../ports/Transcriber.js'
import { withRetry } from './retry.js'

export class WhisperTranscriber implements Transcriber {
  private apiKey: string
  private model: string

  constructor(apiKey?: string, model = 'whisper-1') {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || ''
    this.model = model
  }

  async transcribe(
    audioFilePath: string,
    options?: TranscribeOptions
  ): Promise<Transcript> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured for WhisperTranscriber')
    }

    const fileBuffer = await fs.readFile(audioFilePath)
    const fileName = path.basename(audioFilePath)

    const form = new FormData()
    const blob = new Blob([fileBuffer])
    form.append('file', blob, fileName)
    form.append('model', this.model)
    form.append('response_format', 'verbose_json')
    form.append('timestamp_granularities[]', 'segment')

    if (options?.language) {
      form.append('language', options.language)
    }
    if (options?.prompt) {
      form.append('prompt', options.prompt)
    }

    return await withRetry(async () => {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: form,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Whisper API error (${response.status}): ${errorText}`)
      }

      const data = (await response.json()) as {
        text?: string
        segments?: Array<{
          id?: number | string
          start?: number
          end?: number
          text?: string
        }>
      }

      const segments = (data.segments || []).map((seg, index) => ({
        id: `whisper-${seg.id ?? index}`,
        start: seg.start ?? 0,
        end: seg.end ?? 0,
        text: (seg.text || '').trim(),
      }))

      if (segments.length === 0 && data.text) {
        segments.push({
          id: 'whisper-0',
          start: 0,
          end: 0,
          text: data.text.trim(),
        })
      }

      return {
        sourceId: audioFilePath,
        segments,
      }
    })
  }
}
