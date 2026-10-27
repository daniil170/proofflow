import type { Firestore } from 'firebase-admin/firestore'
import type { Auth } from 'firebase-admin/auth'

export interface RedeemInviteParams {
  code: string
  uid: string
  userEmail?: string
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

export const executeRedeemInvite = async (
  params: RedeemInviteParams
): Promise<RedeemInviteResult> => {
  const { code, uid, userEmail = '', db, auth } = params

  if (!uid) {
    throw new RedeemInviteError('unauthenticated', 'Пользователь не авторизован')
  }

  const normalizedCode = code.trim()
  if (!normalizedCode) {
    throw new RedeemInviteError('not-found', 'Код приглашения не указан')
  }

  const inviteRef = db.collection('invites').doc(normalizedCode)
  const userRef = db.collection('users').doc(uid)

  return await db.runTransaction(async (transaction) => {
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
  }).then(async (result) => {
    await auth.setCustomUserClaims(uid, { access: 'active' })
    return result
  })
}
