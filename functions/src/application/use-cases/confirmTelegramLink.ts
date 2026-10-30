import crypto from 'node:crypto'

export interface ConfirmTelegramLinkInput {
  token: string
  telegramUserId: string | number
  telegramUsername?: string | null
  secret: string
}

export interface ConfirmTelegramLinkResult {
  success: boolean
  uid: string
  telegramUserId: string | number
  telegramUsername: string | null
}

export type ConfirmTelegramLinkErrorCode =
  | 'invalid_secret'
  | 'not_found'
  | 'expired_token'
  | 'already_used'
  | 'invalid_argument'

export class ConfirmTelegramLinkError extends Error {
  constructor(
    public code: ConfirmTelegramLinkErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'ConfirmTelegramLinkError'
  }
}

export function verifyTelegramBotSecret(providedSecret?: string | null): boolean {
  const configuredSecret = process.env.TELEGRAM_BOT_SECRET || process.env.BOT_SECRET
  if (!configuredSecret || typeof configuredSecret !== 'string' || !configuredSecret.trim()) {
    return false
  }
  if (!providedSecret || typeof providedSecret !== 'string' || !providedSecret.trim()) {
    return false
  }
  const providedHash = crypto.createHash('sha256').update(providedSecret).digest()
  const configuredHash = crypto.createHash('sha256').update(configuredSecret).digest()
  return crypto.timingSafeEqual(providedHash, configuredHash)
}

export function extractTelegramBotSecret(
  headers: Record<string, unknown> = {},
  body: Record<string, unknown> = {}
): string {
  const headerSecret =
    headers['x-telegram-bot-secret'] ||
    headers['X-Telegram-Bot-Secret'] ||
    headers['x-bot-secret'] ||
    (typeof headers.authorization === 'string'
      ? headers.authorization.replace(/^Bearer\s+/i, '')
      : '')
  return String(headerSecret || body.secret || body.botSecret || '')
}

export async function executeConfirmTelegramLink(
  input: ConfirmTelegramLinkInput,
  db: FirebaseFirestore.Firestore
): Promise<ConfirmTelegramLinkResult> {
  if (!verifyTelegramBotSecret(input.secret)) {
    throw new ConfirmTelegramLinkError(
      'invalid_secret',
      'Неверный секрет авторизации бота'
    )
  }

  if (!input.token || typeof input.token !== 'string' || !input.token.trim()) {
    throw new ConfirmTelegramLinkError(
      'invalid_argument',
      'Не указан токен привязки'
    )
  }

  if (input.telegramUserId === undefined || input.telegramUserId === null || input.telegramUserId === '') {
    throw new ConfirmTelegramLinkError(
      'invalid_argument',
      'Не указан идентификатор пользователя Telegram'
    )
  }

  const cleanToken = input.token.trim().replace(/^link_/, '')
  const tokenRef = db.collection('telegram_link_tokens').doc(cleanToken)
  const tokenDoc = await tokenRef.get()

  if (!tokenDoc.exists) {
    throw new ConfirmTelegramLinkError(
      'not_found',
      'Неверная или недействительная ссылка привязки'
    )
  }

  const tokenData = tokenDoc.data() || {}

  if (tokenData.used) {
    throw new ConfirmTelegramLinkError(
      'already_used',
      'Эта ссылка привязки уже была использована ранее'
    )
  }

  const now = Date.now()
  if (typeof tokenData.expiresAt === 'number' && tokenData.expiresAt < now) {
    throw new ConfirmTelegramLinkError(
      'expired_token',
      'Срок действия ссылки привязки истёк'
    )
  }

  const uid = tokenData.uid
  if (!uid || typeof uid !== 'string') {
    throw new ConfirmTelegramLinkError(
      'invalid_argument',
      'В токене отсутствует привязка к пользователю'
    )
  }

  const cleanUsername = input.telegramUsername
    ? String(input.telegramUsername).trim().replace(/^@/, '')
    : null

  const userRef = db.collection('users').doc(uid)
  await userRef.set(
    {
      telegramUserId: input.telegramUserId,
      telegramUsername: cleanUsername,
      updatedAt: now,
    },
    { merge: true }
  )

  await tokenRef.update({
    used: true,
    usedAt: now,
    usedByTelegramUserId: input.telegramUserId,
    usedByTelegramUsername: cleanUsername,
  })

  return {
    success: true,
    uid,
    telegramUserId: input.telegramUserId,
    telegramUsername: cleanUsername,
  }
}
