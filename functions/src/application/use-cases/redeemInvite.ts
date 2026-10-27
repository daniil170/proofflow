import type { Firestore } from 'firebase-admin/firestore'
import type { Auth } from 'firebase-admin/auth'
import { RATE_LIMIT_CONFIGS } from '../../domain/rateLimits.js'

export interface RedeemInviteParams {
  code: string
  uid: string
  userEmail?: string
  ip?: string
  db: Firestore
  auth: Auth
}

export interface RedeemInviteResult {
  success: boolean
  accessStatus: 'active'
  alreadyRedeemed?: boolean
}

export class RedeemInviteError extends Error {
  constructor(
    public code: 'not-found' | 'failed-precondition' | 'unauthenticated',
    message: string
  ) {
    super(message)
    this.name = 'RedeemInviteError'
  }
}

const sanitizeKey = (raw: string): string =>
  raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)

const checkIsBlocked = async (
  db: Firestore,
  uid: string,
  ip?: string
): Promise<boolean> => {
  const now = Date.now()
  const keys = [`uid_${sanitizeKey(uid)}`]
  if (ip && ip.trim()) {
    keys.push(`ip_${sanitizeKey(ip.trim())}`)
  }

  for (const k of keys) {
    const snap = await db.collection('invite_attempts').doc(k).get()
    if (!snap.exists) continue
    const data = snap.data()
    const blockedUntil = typeof data?.blockedUntil === 'number' ? data.blockedUntil : 0
    if (blockedUntil > now) {
      return true
    }
    const timestamps: number[] = Array.isArray(data?.timestamps)
      ? data.timestamps.filter(
          (t: unknown) =>
            typeof t === 'number' &&
            now - t < RATE_LIMIT_CONFIGS.INVITE_ATTEMPTS.windowMs
        )
      : []
    if (timestamps.length >= RATE_LIMIT_CONFIGS.INVITE_ATTEMPTS.maxRequests) {
      return true
    }
  }

  return false
}

const recordFailedAttempt = async (
  db: Firestore,
  uid: string,
  ip?: string
): Promise<void> => {
  const now = Date.now()
  const { windowMs, maxRequests, blockDurationMs } = RATE_LIMIT_CONFIGS.INVITE_ATTEMPTS
  const blockDuration = blockDurationMs || windowMs

  const keys = [`uid_${sanitizeKey(uid)}`]
  if (ip && ip.trim()) {
    keys.push(`ip_${sanitizeKey(ip.trim())}`)
  }

  for (const k of keys) {
    const docRef = db.collection('invite_attempts').doc(k)
    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(docRef)
        const data = snap.exists ? snap.data() : null

        const existingTimestamps: number[] = Array.isArray(data?.timestamps)
          ? data.timestamps.filter(
              (t: unknown) => typeof t === 'number' && now - t < windowMs
            )
          : []

        existingTimestamps.push(now)
        const shouldBlock = existingTimestamps.length >= maxRequests
        const blockedUntil = shouldBlock ? now + blockDuration : 0

        tx.set(docRef, {
          timestamps: existingTimestamps,
          blockedUntil,
          updatedAt: now,
        })
      })
    } catch {
      void 0
    }
  }
}

const clearFailedAttempts = async (
  db: Firestore,
  uid: string
): Promise<void> => {
  try {
    const docRef = db.collection('invite_attempts').doc(`uid_${sanitizeKey(uid)}`)
    await docRef.delete()
  } catch {
    void 0
  }
}

export const executeRedeemInvite = async (
  params: RedeemInviteParams
): Promise<RedeemInviteResult> => {
  const { code, uid, userEmail = '', ip, db, auth } = params

  if (!uid) {
    throw new RedeemInviteError('unauthenticated', 'Пользователь не авторизован')
  }

  const isBlocked = await checkIsBlocked(db, uid, ip)
  if (isBlocked) {
    throw new RedeemInviteError(
      'failed-precondition',
      'Слишком много неудачных попыток ввода кода приглашения. Попробуйте снова через 15 минут.'
    )
  }

  const normalizedCode = code.trim()
  if (!normalizedCode) {
    await recordFailedAttempt(db, uid, ip)
    throw new RedeemInviteError('not-found', 'Код приглашения не указан')
  }

  const inviteRef = db.collection('invites').doc(normalizedCode)
  const userRef = db.collection('users').doc(uid)

  try {
    const result = await db.runTransaction(async (transaction) => {
      const inviteSnap = await transaction.get(inviteRef)
      if (!inviteSnap.exists) {
        throw new RedeemInviteError('not-found', 'Приглашение не найдено')
      }

      const invite = inviteSnap.data()!
      const userSnap = await transaction.get(userRef)
      const existingUserData = userSnap.exists ? userSnap.data() : null

      if (
        existingUserData?.accessStatus === 'active' &&
        invite.usedBy === uid &&
        invite.status === 'used'
      ) {
        return {
          success: true,
          accessStatus: 'active' as const,
          alreadyRedeemed: true,
        }
      }

      if (invite.status === 'revoked') {
        throw new RedeemInviteError('failed-precondition', 'Приглашение отозвано')
      }

      if (invite.status === 'used') {
        throw new RedeemInviteError(
          'failed-precondition',
          'Приглашение уже использовано'
        )
      }

      if (invite.expiresAt && Date.now() > invite.expiresAt) {
        throw new RedeemInviteError(
          'failed-precondition',
          'Срок действия приглашения истёк'
        )
      }

      const now = Date.now()

      transaction.update(inviteRef, {
        status: 'used',
        usedBy: uid,
        usedAt: now,
      })

      const userPayload: Record<string, unknown> = {
        id: uid,
        email: userEmail || existingUserData?.email || '',
        accessStatus: 'active',
        workspaceId: uid,
        updatedAt: now,
      }

      if (invite.telegramUserId !== undefined && invite.telegramUserId !== null) {
        userPayload.telegramUserId = invite.telegramUserId
      }

      if (!userSnap.exists) {
        userPayload.createdAt = now
        transaction.set(userRef, userPayload)
      } else {
        transaction.set(userRef, userPayload, { merge: true })
      }

      if (invite.applicationId) {
        const appRef = db.collection('beta_signups').doc(invite.applicationId)
        transaction.set(
          appRef,
          {
            status: 'activated',
            activatedAt: now,
            updatedAt: now,
          },
          { merge: true }
        )
      }

      return {
        success: true,
        accessStatus: 'active' as const,
      }
    })

    await clearFailedAttempts(db, uid)
    await auth.setCustomUserClaims(uid, { access: 'active' })
    return result
  } catch (error) {
    if (error instanceof RedeemInviteError && error.code !== 'unauthenticated') {
      await recordFailedAttempt(db, uid, ip)
    }
    throw error
  }
}
