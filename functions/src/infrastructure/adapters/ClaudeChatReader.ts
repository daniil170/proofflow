import { promises as fs } from 'fs'
import path from 'path'
import { chatExtractionSchema } from '../../domain/schemas.js'
import { ChatExtraction } from '../../domain/types.js'
import { ChatReader } from '../ports/ChatReader.js'
import { getChatReaderPrompt } from '../prompts/prompts.js'
import { withRetry } from './retry.js'

interface AnthropicContentBlock {
  type: string
  text?: string
}

interface AnthropicResponse {
  content?: AnthropicContentBlock[]
}

export class ClaudeChatReader implements ChatReader {
  private apiKey: string
  private model: string

  constructor(apiKey?: string, model?: string) {
    const selectedModel =
      model ||
      process.env.ANTHROPIC_VISION_MODEL ||
      process.env.ANTHROPIC_MODEL
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || ''
    if (!selectedModel) {
      throw new Error(
        'Не задана модель Claude в переменной окружения ANTHROPIC_MODEL. Укажите актуальное имя модели.'
      )
    }
    this.model = selectedModel
  }

  async readScreenshot(
    imageFilePath: string,
    screenshotSourceId: string,
    order = 0
  ): Promise<ChatExtraction> {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured for ClaudeChatReader')
    }

    const systemPrompt = await getChatReaderPrompt()
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
          max_tokens: 4096,
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
                  text: 'Распознай диалог из этого скриншота переписки и верни строго валидный JSON.',
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Anthropic Vision request failed with status ${response.status}: ${errorText}`
        )
      }

      const data = (await response.json()) as AnthropicResponse
      const contentBlock = data.content?.[0]
      if (!contentBlock || contentBlock.type !== 'text' || !contentBlock.text) {
        throw new Error('Unexpected response format from Anthropic API: missing text block')
      }

      const rawJson = contentBlock.text
      const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleanJson)

      return chatExtractionSchema.parse({
        screenshotSourceId,
        messenger: parsed.messenger || 'unknown',
        order,
        messages: parsed.messages || [],
        confidence: parsed.confidence !== undefined ? parsed.confidence : 1.0,
      })
    })
  }
}
