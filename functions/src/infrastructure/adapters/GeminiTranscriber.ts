import { promises as fs } from 'fs'
import path from 'path'
import { transcriptSchema } from '../../domain/schemas.js'
import { Transcript } from '../../domain/types.js'
import { TranscribeOptions, Transcriber } from '../ports/Transcriber.js'
import { GeminiClient, GeminiConfig } from './geminiClient.js'

export class GeminiTranscriber implements Transcriber {
  private client: GeminiClient

  constructor(config?: GeminiConfig) {
    this.client = new GeminiClient(config)
  }

  private detectAudioMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    if (ext === '.wav') return 'audio/wav'
    if (ext === '.ogg' || ext === '.opus') return 'audio/ogg'
    if (ext === '.m4a' || ext === '.aac') return 'audio/m4a'
    if (ext === '.webm') return 'audio/webm'
    if (ext === '.flac') return 'audio/flac'
    return 'audio/mp3'
  }

  async transcribe(
    audioFilePath: string,
    options?: TranscribeOptions
  ): Promise<Transcript> {
    const fileBuffer = await fs.readFile(audioFilePath)
    const base64Data = fileBuffer.toString('base64')
    const mimeType = this.detectAudioMimeType(audioFilePath)

    const systemInstruction =
      'You are a high-precision audio transcription specialist. Transcribe the audio recording accurately into timestamped segments. Return strictly valid JSON matching this schema: { "segments": [{ "id": "seg-0", "start": 0.0, "end": 2.5, "text": "transcribed text" }] }'

    const langPrompt = options?.language ? `Language: ${options.language}.` : ''
    const userPrompt = options?.prompt ? `Additional context: ${options.prompt}.` : ''
    const promptText = `Transcribe this audio recording into chronological segments with accurate start and end timestamps in seconds. ${langPrompt} ${userPrompt} Output raw valid JSON only.`

    const result = await this.client.generateContent({
      systemInstruction,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
    })

    const parsed = result.parsed as {
      segments?: Array<{
        id?: string | number
        start?: number
        end?: number
        text?: string
      }>
    }

    const segments = (parsed.segments || []).map((seg, index) => ({
      id: String(seg.id ?? `gemini-${index}`),
      start: Number(seg.start ?? 0),
      end: Number(seg.end ?? 0),
      text: String(seg.text || '').trim(),
    }))

    return transcriptSchema.parse({
      sourceId: audioFilePath,
      segments,
    })
  }
}
