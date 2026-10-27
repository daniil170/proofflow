import { promises as fs } from 'fs'
import path from 'path'
import { GoogleAuth } from 'google-auth-library'
import { transcriptSchema } from '../../domain/schemas.js'
import { Transcript } from '../../domain/types.js'
import { TranscribeOptions, Transcriber } from '../ports/Transcriber.js'
import { withRetry } from './retry.js'

export interface GoogleSpeechConfig {
  region?: string
  languageCode?: string
  apiKey?: string
}

interface SpeechWord {
  word?: string
  startTime?: string
  endTime?: string
}

interface SpeechAlternative {
  transcript?: string
  words?: SpeechWord[]
}

interface SpeechResult {
  alternatives?: SpeechAlternative[]
}

interface SpeechResponse {
  results?: SpeechResult[]
}

export class GoogleSpeechTranscriber implements Transcriber {
  private region?: string
  private languageCode: string
  private apiKey?: string
  private googleAuth?: GoogleAuth

  constructor(config?: GoogleSpeechConfig) {
    this.region = config?.region || process.env.GOOGLE_SPEECH_REGION
    this.languageCode = config?.languageCode || process.env.GOOGLE_SPEECH_LANGUAGE || 'ru-RU'
    this.apiKey = config?.apiKey || process.env.GOOGLE_SPEECH_API_KEY

    if (!this.apiKey) {
      this.googleAuth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      })
    }
  }

  private parseTimeOffset(timeStr?: string): number {
    if (!timeStr) return 0
    const cleaned = timeStr.replace('s', '').trim()
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  private detectEncoding(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    if (ext === '.wav') return 'LINEAR16'
    if (ext === '.flac') return 'FLAC'
    if (ext === '.ogg' || ext === '.opus') return 'OGG_OPUS'
    if (ext === '.mp3') return 'MP3'
    return 'ENCODING_UNSPECIFIED'
  }

  private async getEndpointUrl(): Promise<string> {
    const host = this.region
      ? `${encodeURIComponent(this.region)}-speech.googleapis.com`
      : 'speech.googleapis.com'
    if (this.apiKey) {
      return `https://${host}/v1/speech:recognize?key=${encodeURIComponent(this.apiKey)}`
    }
    return `https://${host}/v1/speech:recognize`
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (!this.apiKey && this.googleAuth) {
      const client = await this.googleAuth.getClient()
      const token = (await client.getAccessToken()).token
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    return headers
  }

  async transcribe(
    audioFilePath: string,
    options?: TranscribeOptions
  ): Promise<Transcript> {
    const fileBuffer = await fs.readFile(audioFilePath)
    const base64Audio = fileBuffer.toString('base64')
    const encoding = this.detectEncoding(audioFilePath)

    const languageCode = options?.language || this.languageCode

    return await withRetry(async () => {
      const url = await this.getEndpointUrl()
      const headers = await this.getHeaders()

      const requestBody = {
        config: {
          encoding,
          languageCode,
          enableWordTimeOffsets: true,
          enableAutomaticPunctuation: true,
          model: 'default',
        },
        audio: {
          content: base64Audio,
        },
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Google Speech API error (${response.status}): ${errorText}`
        )
      }

      const data = (await response.json()) as SpeechResponse

      const segments: Array<{
        id: string
        start: number
        end: number
        text: string
      }> = []

      let segmentIndex = 0

      for (const result of data.results || []) {
        const alt = result.alternatives?.[0]
        if (!alt) continue

        const words = alt.words || []
        if (words.length === 0 && alt.transcript) {
          segments.push({
            id: `google-speech-${segmentIndex++}`,
            start: 0,
            end: 0,
            text: alt.transcript.trim(),
          })
          continue
        }

        let currentWords: string[] = []
        let segmentStart = this.parseTimeOffset(words[0]?.startTime)
        let segmentEnd = segmentStart

        for (let i = 0; i < words.length; i++) {
          const w = words[i]
          const wordText = w.word || ''
          currentWords.push(wordText)
          segmentEnd = this.parseTimeOffset(w.endTime)

          const isSentenceEnd = /[.!?]$/.test(wordText)
          const isLongChunk = currentWords.length >= 15
          const isLastWord = i === words.length - 1

          if (isSentenceEnd || isLongChunk || isLastWord) {
            segments.push({
              id: `google-speech-${segmentIndex++}`,
              start: segmentStart,
              end: segmentEnd,
              text: currentWords.join(' ').trim(),
            })
            currentWords = []
            if (!isLastWord && words[i + 1]) {
              segmentStart = this.parseTimeOffset(words[i + 1].startTime)
            }
          }
        }
      }

      return transcriptSchema.parse({
        sourceId: audioFilePath,
        segments,
      })
    })
  }
}
