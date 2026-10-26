import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chatExtractionSchema } from '../../domain/schemas.js'
import { ChatExtraction } from '../../domain/types.js'
import { ChatReader } from '../ports/ChatReader.js'
import { withRetry } from './retry.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SYSTEM_PROMPT_PATH = path.resolve(__dirname, '../prompts/chat-reader-system.txt')

export class ClaudeChatReader implements ChatReader {
  private apiKey: string
  private model: string

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || ''
    this.model =
      model ||
      process.env.ANTHROPIC_VISION_MODEL ||
      process.env.ANTHROPIC_MODEL ||
      'claude-3-5-sonnet-20241022'
  }

  async readScreenshot(
    imageFilePath: string,
    screenshotSourceId: string,
    order = 0
  ): Promise<ChatExtraction> {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured for ClaudeChatReader')
    }

    const systemPrompt = await fs.readFile(SYSTEM_PROMPT_PATH, 'utf-8')
    const imageBuffer = await fs.readFile(imageFilePath)
    const base64Data = imageBuffer.toString('base64')

    const ext = path.extname(imageFilePath).toLowerCase()
    let mediaType = 'image/png'
    if (ext === '.jpg' || ext === '.jpeg') mediaType = 'image/jpeg'
    if (ext === '.webp') mediaType = 'image/webp'

    return await withRetry(async () => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Data,
                  },
                },
                {
                  type: 'text',
                  text: 'Extract the conversation from this screenshot into the required JSON structure.',
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Claude API error (${response.status}): ${errorText}`)
      }

      const data = (await response.json()) as {
        content?: Array<{ type: string; text?: string }>
      }

      const rawText = data.content?.[0]?.text || ''
      const jsonStart = rawText.indexOf('{')
      const jsonEnd = rawText.lastIndexOf('}')
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No valid JSON found in Claude ChatReader response')
      }

      const parsedJson = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1))
      return chatExtractionSchema.parse({
        screenshotSourceId,
        order,
        confidence: parsedJson.confidence ?? 0.9,
        messages: parsedJson.messages || [],
      })
    })
  }
}
