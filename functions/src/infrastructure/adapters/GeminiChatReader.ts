import { promises as fs } from 'fs'
import path from 'path'
import { chatExtractionSchema } from '../../domain/schemas.js'
import { ChatExtraction } from '../../domain/types.js'
import { ChatReader } from '../ports/ChatReader.js'
import { getChatReaderPrompt } from '../prompts/prompts.js'
import { GeminiClient, GeminiConfig } from './geminiClient.js'

export class GeminiChatReader implements ChatReader {
  private client: GeminiClient

  constructor(config?: GeminiConfig) {
    this.client = new GeminiClient(config)
  }

  async readScreenshot(
    imageFilePath: string,
    screenshotSourceId: string,
    order = 0
  ): Promise<ChatExtraction> {
    const systemPrompt = await getChatReaderPrompt()
    const imageBuffer = await fs.readFile(imageFilePath)
    const base64Data = imageBuffer.toString('base64')

    const ext = path.extname(imageFilePath).toLowerCase()
    let mediaType = 'image/png'
    if (ext === '.jpg' || ext === '.jpeg') mediaType = 'image/jpeg'
    if (ext === '.webp') mediaType = 'image/webp'

    const result = await this.client.generateContent({
      systemInstruction: systemPrompt,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mediaType,
                data: base64Data,
              },
            },
            {
              text: 'Распознай диалог из этого скриншота переписки и верни строго валидный JSON по контракту системы.',
            },
          ],
        },
      ],
    })

    const parsed = result.parsed as {
      messages?: unknown[]
      confidence?: number
    }

    return chatExtractionSchema.parse({
      screenshotSourceId,
      order,
      messages: parsed.messages || [],
      confidence: parsed.confidence !== undefined ? parsed.confidence : 1.0,
    })
  }
}
