import { caseDraftSchema } from '../../domain/schemas.js'
import { CaseDraft } from '../../domain/types.js'
import { AnalysisInput, CaseAnalyzer } from '../ports/CaseAnalyzer.js'
import { getAnalyzerPrompt } from '../prompts/prompts.js'
import { GeminiClient, GeminiConfig } from './geminiClient.js'

export class GeminiCaseAnalyzer implements CaseAnalyzer {
  private client: GeminiClient

  constructor(config?: GeminiConfig) {
    this.client = new GeminiClient(config)
  }

  async analyze(input: AnalysisInput): Promise<CaseDraft> {
    const systemPrompt = await getAnalyzerPrompt()

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
      headline?: unknown
      metric?: unknown
      problem?: unknown
      solution?: unknown
      result?: unknown
      summaryRows?: unknown[]
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

    const rawHeadline = typeof parsed.headline === 'string'
      ? { text: parsed.headline.trim(), evidenceId: null }
      : (parsed.headline && typeof parsed.headline === 'object'
          ? parsed.headline
          : { text: '', evidenceId: null })

    return caseDraftSchema.parse({
      ...parsed,
      headline: rawHeadline,
      summaryRows: Array.isArray(parsed.summaryRows) ? parsed.summaryRows : [],
      quote: {
        text: String(parsed.quote?.text || ''),
        authorLabel: 'Клиент',
        authorRole: typeof parsed.quote?.authorRole === 'string' ? parsed.quote.authorRole : '',
        authorCompany: typeof parsed.quote?.authorCompany === 'string' ? parsed.quote.authorCompany : '',
      },
      missingFields: parsed.missingFields || [],
      needsReview: parsed.needsReview || [],
      tags: parsed.tags || [],
    })
  }
}
