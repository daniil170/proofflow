import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { caseDraftSchema } from '../../domain/schemas.js'
import { CaseDraft } from '../../domain/types.js'
import { AnalysisInput, CaseAnalyzer } from '../ports/CaseAnalyzer.js'
import { GeminiClient, GeminiConfig } from './geminiClient.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SYSTEM_PROMPT_PATH = path.resolve(__dirname, '../prompts/analyzer-system.txt')

export class GeminiCaseAnalyzer implements CaseAnalyzer {
  private client: GeminiClient

  constructor(config?: GeminiConfig) {
    this.client = new GeminiClient(config)
  }

  async analyze(input: AnalysisInput): Promise<CaseDraft> {
    const systemPrompt = await fs.readFile(SYSTEM_PROMPT_PATH, 'utf-8')

    const userPromptPayload = {
      clientLabel: input.clientLabel || 'Клиент',
      language: input.language || 'ru',
      transcripts: input.transcripts,
      chatExtractions: input.chatExtractions,
    }

    const languageInstruction = `Язык ответа строго совпадает с языком исходных материалов (${input.language || 'ru'}).`

    const result = await this.client.generateContent({
      systemInstruction: `${systemPrompt}\n\n${languageInstruction}`,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Проанализируй предоставленные материалы кейса и сформируй строго валидный JSON по контракту системы:\n\n${JSON.stringify(userPromptPayload, null, 2)}`,
            },
          ],
        },
      ],
    })

    const parsed = result.parsed as {
      metric?: unknown
      problem?: unknown
      solution?: unknown
      result?: unknown
      quote?: {
        text?: unknown
        authorLabel?: unknown
        authorRole?: unknown
        authorCompany?: unknown
      }
      missingFields?: unknown[]
      needsReview?: unknown[]
      tags?: unknown[]
    }

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
  }
}
