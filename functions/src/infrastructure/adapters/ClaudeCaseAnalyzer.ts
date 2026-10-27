import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { caseDraftSchema } from '../../domain/schemas.js'
import { CaseDraft } from '../../domain/types.js'
import { AnalysisInput, CaseAnalyzer } from '../ports/CaseAnalyzer.js'
import { withRetry } from './retry.js'

interface AnthropicContentBlock {
  type: string
  text?: string
}

interface AnthropicResponse {
  content?: AnthropicContentBlock[]
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SYSTEM_PROMPT_PATH = path.resolve(__dirname, '../prompts/analyzer-system.txt')

export class ClaudeCaseAnalyzer implements CaseAnalyzer {
  private apiKey: string
  private model: string

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || ''
    const selectedModel =
      model ||
      process.env.ANTHROPIC_MODEL ||
      process.env.ANALYZER_MODEL
    if (!selectedModel) {
      throw new Error(
        'Не задана модель Claude в переменной окружения ANTHROPIC_MODEL. Укажите актуальное имя модели.'
      )
    }
    this.model = selectedModel
  }

  async analyze(input: AnalysisInput): Promise<CaseDraft> {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured for ClaudeCaseAnalyzer')
    }

    const systemPrompt = await fs.readFile(SYSTEM_PROMPT_PATH, 'utf-8')

    const userPromptPayload = {
      clientLabel: input.clientLabel || 'Клиент',
      language: input.language || 'ru',
      transcripts: input.transcripts,
      chatExtractions: input.chatExtractions,
    }

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
              content: `Проанализируй предоставленные материалы кейса и сформируй строго валидный JSON по контракту системы:\n\n${JSON.stringify(userPromptPayload, null, 2)}`,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Anthropic API request failed with status ${response.status}: ${errorText}`
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

      return caseDraftSchema.parse({
        ...parsed,
        quote: {
          ...parsed.quote,
          authorCompany: parsed.quote?.authorCompany || input.clientLabel || undefined,
        },
        missingFields: parsed.missingFields || [],
        needsReview: parsed.needsReview || [],
        tags: parsed.tags || [],
      })
    })
  }
}
