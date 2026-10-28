import { GoogleAuth } from 'google-auth-library'
import { withRetry } from './retry.js'

export interface GeminiConfig {
  mode?: 'vertex' | 'api'
  region?: string
  model?: string
  apiKey?: string
  projectId?: string
  tier?: string
}

export interface GeminiPart {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
}

export interface GeminiContent {
  role?: string
  parts: GeminiPart[]
}

export interface GeminiUsageMetadata {
  promptTokenCount?: number
  candidatesTokenCount?: number
  totalTokenCount?: number
}

export interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>
  }
  finishReason?: string
}

export interface GeminiApiResponse {
  candidates?: GeminiCandidate[]
  usageMetadata?: GeminiUsageMetadata
}

export interface GeminiGenerateOptions {
  systemInstruction?: string
  contents: GeminiContent[]
  responseSchema?: Record<string, unknown>
  temperature?: number
}

export interface GeminiResult {
  text: string
  parsed: unknown
  usageMetadata?: GeminiUsageMetadata
}

const checkTierProtection = (tier?: string): void => {
  const isProd =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.K_SERVICE) ||
    Boolean(process.env.FUNCTION_TARGET && process.env.FUNCTIONS_EMULATOR !== 'true')

  const effectiveTier = tier || process.env.GEMINI_TIER
  if (isProd && effectiveTier === 'free') {
    throw new Error(
      'Критическая ошибка безопасности: в продакшен-окружении запрещено использовать GEMINI_TIER=free. На бесплатном тарифе данные могут использоваться для улучшения продуктов провайдера. Используйте платный тариф (pay-as-you-go) или корпоративный Vertex AI.'
    )
  }
}

export class GeminiClient {
  private mode: 'vertex' | 'api'
  private region: string
  private model: string
  private apiKey: string
  private projectId?: string
  private googleAuth?: GoogleAuth

  constructor(config?: GeminiConfig) {
    checkTierProtection(config?.tier)

    const rawMode = (config?.mode || process.env.GEMINI_MODE || 'vertex').toLowerCase()
    if (rawMode !== 'vertex' && rawMode !== 'api') {
      throw new Error(`Недопустимый режим GEMINI_MODE: ${rawMode}. Допустимы "vertex" или "api".`)
    }
    this.mode = rawMode

    const selectedModel =
      config?.model ||
      (config as { modelName?: string } | undefined)?.modelName ||
      process.env.GEMINI_MODEL ||
      'gemini-2.5-flash'
    this.model = selectedModel

    if (this.mode === 'vertex') {
      const selectedRegion =
        config?.region || process.env.GEMINI_REGION || process.env.VERTEX_REGION
      if (!selectedRegion) {
        throw new Error(
          'Не задан регион Vertex AI в переменной окружения GEMINI_REGION или VERTEX_REGION.'
        )
      }
      this.region = selectedRegion
      this.projectId =
        config?.projectId ||
        process.env.GCLOUD_PROJECT ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.FIREBASE_CONFIG
          ? this.extractProjectId(process.env.FIREBASE_CONFIG)
          : undefined
      this.apiKey = ''
      this.googleAuth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      })
    } else {
      this.region = ''
      const selectedApiKey = config?.apiKey || process.env.GEMINI_API_KEY
      if (!selectedApiKey) {
        throw new Error('GEMINI_API_KEY не задан для режима GEMINI_MODE=api.')
      }
      this.apiKey = selectedApiKey
    }
  }

  private extractProjectId(firebaseConfig?: string): string | undefined {
    if (!firebaseConfig) return undefined
    try {
      const parsed = JSON.parse(firebaseConfig)
      return parsed.projectId
    } catch {
      return undefined
    }
  }

  async getEndpointUrl(): Promise<string> {
    if (this.mode === 'api') {
      return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`
    }

    let project = this.projectId
    if (!project && this.googleAuth) {
      project = await this.googleAuth.getProjectId()
    }
    if (!project) {
      throw new Error(
        'Не удалось определить ID Google Cloud проекта для Vertex AI. Задайте переменную GCLOUD_PROJECT.'
      )
    }

    return `https://${this.region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${this.region}/publishers/google/models/${encodeURIComponent(this.model)}:generateContent`
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (this.mode === 'api') {
      return {
        'Content-Type': 'application/json',
      }
    }

    if (!this.googleAuth) {
      throw new Error('GoogleAuth не инициализирован для режима Vertex AI.')
    }

    const client = await this.googleAuth.getClient()
    const tokenResponse = await client.getAccessToken()
    const token = tokenResponse.token
    if (!token) {
      throw new Error('Не удалось получить токен доступа сервисного аккаунта для Vertex AI.')
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
  }

  parseGeminiResponse(data: GeminiApiResponse): GeminiResult {
    const candidate = data.candidates?.[0]
    if (!candidate) {
      throw new Error('Ответ Gemini не содержит кандидатов.')
    }

    if (candidate.finishReason === 'MAX_TOKENS') {
      throw new Error('Ответ Gemini был обрезан по лимиту токенов (MAX_TOKENS). Ответ неполон.')
    }

    const contentPart = candidate.content?.parts?.[0]
    if (!contentPart || typeof contentPart.text !== 'string') {
      throw new Error('Неожиданный формат ответа Gemini: отсутствует текстовый блок.')
    }

    const rawText = contentPart.text.trim()
    if (!rawText) {
      throw new Error('Gemini вернул пустой текстовый ответ.')
    }

    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/i, '')
      .trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(cleanJson)
    } catch (parseError: unknown) {
      const message = parseError instanceof Error ? parseError.message : String(parseError)
      throw new Error(`Не удалось разобрать JSON ответа Gemini: ${message}. Исходный текст: ${rawText.slice(0, 300)}`)
    }

    return {
      text: cleanJson,
      parsed,
      usageMetadata: data.usageMetadata,
    }
  }

  async generateContent(options: GeminiGenerateOptions): Promise<GeminiResult> {
    return await withRetry(async () => {
      const url = await this.getEndpointUrl()
      const headers = await this.getAuthHeaders()

      const requestBody: Record<string, unknown> = {
        contents: options.contents,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: options.temperature ?? 0.2,
          ...(options.responseSchema ? { responseSchema: options.responseSchema } : {}),
        },
      }

      if (options.systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Gemini API request failed (${this.mode}) with status ${response.status}: ${errorText}`
        )
      }

      const data = (await response.json()) as GeminiApiResponse
      return this.parseGeminiResponse(data)
    })
  }
}
