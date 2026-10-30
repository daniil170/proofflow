import { config } from '../../shared/config.js'

export interface ConfirmLinkParams {
  token: string
  telegramUserId: number
  telegramUsername?: string
  secret: string
}

export interface ConfirmLinkResult {
  success: boolean
  uid?: string
  error?: 'invalid_token' | 'expired_token' | 'already_used' | 'invalid_secret' | string
  message?: string
}

export interface TelegramLinkGateway {
  confirmLink(params: ConfirmLinkParams): Promise<ConfirmLinkResult>
}

export class HttpTelegramLinkGateway implements TelegramLinkGateway {
  constructor(private readonly baseUrl?: string) {}

  async confirmLink(params: ConfirmLinkParams): Promise<ConfirmLinkResult> {
    const base =
      this.baseUrl ||
      config.functionsBaseUrl ||
      process.env.FUNCTIONS_BASE_URL ||
      process.env.FIREBASE_FUNCTIONS_URL ||
      'https://us-central1-demo-proofflow-rules-test.cloudfunctions.net'

    const url = `${base.replace(/\/$/, '')}/confirmTelegramLinkHttp`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Secret': params.secret,
          'x-bot-secret': params.secret,
        },
        body: JSON.stringify({
          token: params.token,
          telegramUserId: params.telegramUserId,
          telegramUsername: params.telegramUsername,
          secret: params.secret,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>

      if (response.ok && data.success) {
        return {
          success: true,
          uid: typeof data.uid === 'string' ? data.uid : undefined,
        }
      }

      let error = typeof data.code === 'string' ? data.code : ''
      if (!error) {
        if (response.status === 401) error = 'invalid_secret'
        else if (response.status === 404) error = 'invalid_token'
        else if (response.status === 409) error = 'already_used'
        else if (response.status === 410) error = 'expired_token'
        else error = 'server_error'
      }

      return {
        success: false,
        error,
        message: typeof data.error === 'string' ? data.error : undefined,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error'
      return {
        success: false,
        error: 'network_error',
        message: msg,
      }
    }
  }
}

let activeGateway: TelegramLinkGateway | null = null

export const getTelegramLinkGateway = (): TelegramLinkGateway => {
  if (!activeGateway) {
    activeGateway = new HttpTelegramLinkGateway(config.functionsBaseUrl)
  }
  return activeGateway
}

export const setTelegramLinkGateway = (gateway: TelegramLinkGateway | null): void => {
  activeGateway = gateway
}
