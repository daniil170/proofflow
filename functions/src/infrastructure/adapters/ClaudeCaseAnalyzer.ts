import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { caseDraftSchema } from '../../domain/schemas.js'
import { CaseDraft } from '../../domain/types.js'
import { AnalysisInput, CaseAnalyzer } from '../ports/CaseAnalyzer.js'
import { withRetry } from './retry.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SYSTEM_PROMPT_PATH = path.resolve(__dirname, '../prompts/analyzer-system.txt')

export class ClaudeCaseAnalyzer implements CaseAnalyzer {
  private apiKey: string
  private model: string

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || ''
    this.model =
      model ||
      process.env.ANTHROPIC_MODEL ||
      process.env.ANALYZER_MODEL ||
      'claude-3-5-sonnet-20241022'
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
          max_tokens: 3000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: JSON.stringify(userPromptPayload),
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
        throw new Error('No valid JSON found in Claude CaseAnalyzer response')
      }

      const parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1))
      return caseDraftSchema.parse({
        metric: {
          value: parsed.metric?.value || '',
          label: parsed.metric?.label || '',
          evidenceId: null,
        },
        problem: parsed.problem || '',
        solution: parsed.solution || '',
        result: parsed.result || '',
        quote: {
          text: parsed.quote?.text || '',
          authorLabel: parsed.quote?.authorLabel || 'Анна К.',
          authorRole: parsed.quote?.authorRole || undefined,
          authorCompany: parsed.quote?.authorCompany || input.clientLabel || undefined,
          evidenceId: null,
        },
        tags: parsed.tags || [],
        missingFields: parsed.missingFields || [],
        needsReview: parsed.needsReview || [],
      })
    })
  }
}
