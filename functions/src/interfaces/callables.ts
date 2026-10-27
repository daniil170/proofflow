import crypto from 'crypto'
import admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import {
  executeRedeemInvite,
  RedeemInviteError,
} from '../application/use-cases/redeemInvite.js'

if (!admin.apps.length) {
  admin.initializeApp()
}

export const redeemInvite = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 30,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется авторизация')
    }

    const { code } = (request.data as { code?: string }) || {}
    if (!code || typeof code !== 'string') {
      throw new HttpsError('invalid-argument', 'Не указан код приглашения')
    }

    try {
      const result = await executeRedeemInvite({
        code,
        uid: request.auth.uid,
        userEmail: request.auth.token.email || '',
        db: admin.firestore(),
        auth: admin.auth(),
      })
      return result
    } catch (err) {
      if (err instanceof RedeemInviteError) {
        throw new HttpsError(err.code, err.message)
      }
      throw new HttpsError('internal', 'Ошибка при активации приглашения')
    }
  }
)

export const checkInvite = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 15,
  },
  async (request) => {
    const { code } = (request.data as { code?: string }) || {}
    if (!code || typeof code !== 'string') {
      throw new HttpsError('invalid-argument', 'Код приглашения не указан')
    }

    const inviteSnap = await admin
      .firestore()
      .collection('invites')
      .doc(code.trim())
      .get()

    if (!inviteSnap.exists) {
      return {
        valid: false,
        status: 'not_found',
        message: 'Приглашение не найдено',
      }
    }

    const invite = inviteSnap.data()!

    if (invite.status === 'revoked') {
      return {
        valid: false,
        status: 'revoked',
        message: 'Приглашение отозвано',
      }
    }

    if (invite.status === 'used') {
      return {
        valid: false,
        status: 'used',
        message: 'Приглашение уже использовано',
      }
    }

    if (invite.expiresAt && Date.now() > invite.expiresAt) {
      return {
        valid: false,
        status: 'expired',
        message: 'Срок действия приглашения истёк',
      }
    }

    return {
      valid: true,
      status: 'issued',
      expiresAt: invite.expiresAt,
      channel: invite.channel,
    }
  }
)

export const createTelegramLinkToken = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 15,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется авторизация')
    }

    const token = crypto.randomBytes(16).toString('hex')
    const now = Date.now()
    const expiresAt = now + 15 * 60 * 1000

    await admin.firestore().collection('telegram_link_tokens').doc(token).set({
      token,
      uid: request.auth.uid,
      createdAt: now,
      expiresAt,
    })

    const botUsername =
      process.env.TELEGRAM_BOT_USERNAME ||
      process.env.VITE_TELEGRAM_BOT_NAME ||
      'ProofFlowBot'

    return {
      token,
      botUsername,
      expiresAt,
    }
  }
)
