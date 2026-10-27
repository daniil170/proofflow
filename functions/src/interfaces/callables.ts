import crypto from 'crypto'
import admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import {
  executeRedeemInvite,
  RedeemInviteError,
} from '../application/use-cases/redeemInvite.js'
import {
  executePublishCase,
  PublishCaseError,
} from '../application/use-cases/publishCase.js'
import {
  executeUnpublishCase,
  UnpublishCaseError,
} from '../application/use-cases/unpublishCase.js'

if (!admin.apps.length) {
  admin.initializeApp()
}

const UNAMBIGUOUS_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export const generateInviteCode = (): string => {
  const getRandomChar = () =>
    UNAMBIGUOUS_CHARS[crypto.randomInt(0, UNAMBIGUOUS_CHARS.length)]
  const part1 = Array.from({ length: 4 }, getRandomChar).join('')
  const part2 = Array.from({ length: 2 }, getRandomChar).join('')
  return `PF-${part1}-${part2}`
}

const submissionTimestamps = new Map<string, number[]>()

const isRateLimited = (identifier: string): boolean => {
  const now = Date.now()
  const windowMs = 10 * 60 * 1000
  const maxRequests = 10
  const timestamps = (submissionTimestamps.get(identifier) || []).filter(
    (t) => now - t < windowMs
  )
  if (timestamps.length >= maxRequests) {
    return true
  }
  timestamps.push(now)
  submissionTimestamps.set(identifier, timestamps)
  return false
}

const getAdminEmails = (): string[] => {
  const raw = process.env.ADMIN_EMAILS || 'admin@proofflow.ru,owner@proofflow.ru'
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

const getAdminTelegramIds = (): string[] => {
  const raw = process.env.ADMIN_TELEGRAM_IDS || ''
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

export const checkIsAdmin = (
  email?: string,
  telegramUserId?: string | number
): boolean => {
  if (email) {
    const normalized = email.trim().toLowerCase()
    if (getAdminEmails().includes(normalized)) return true
  }
  if (telegramUserId !== undefined && telegramUserId !== null) {
    const stringId = String(telegramUserId).trim()
    if (getAdminTelegramIds().includes(stringId)) return true
  }
  return false
}

const requireAdmin = async (request: {
  auth?: { uid: string; token: Record<string, unknown> }
}) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Требуется авторизация')
  }
  const token = request.auth.token
  const email = (token.email as string) || ''
  if (token.admin === true || checkIsAdmin(email)) {
    return
  }
  const userDoc = await admin
    .firestore()
    .collection('users')
    .doc(request.auth.uid)
    .get()
  const userData = userDoc.exists ? userDoc.data() : null
  if (userData && checkIsAdmin(userData.email, userData.telegramUserId)) {
    return
  }
  throw new HttpsError(
    'permission-denied',
    'Доступ разрешен только администраторам'
  )
}

export const submitApplication = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 20,
  },
  async (request) => {
    const data = (request.data as Record<string, unknown>) || {}
    const honeypot = (data.websiteHoneypot || data.website_url_hp || '') as string
    if (honeypot.trim()) {
      return { success: true, id: 'hp-blocked' }
    }

    const clientIp = request.rawRequest.ip || 'anonymous'
    if (isRateLimited(clientIp)) {
      throw new HttpsError(
        'resource-exhausted',
        'Слишком много запросов. Пожалуйста, подождите несколько минут.'
      )
    }

    const email = typeof data.email === 'string' ? data.email.trim() : ''
    const telegramUsername =
      typeof data.telegramUsername === 'string'
        ? data.telegramUsername.trim().replace(/^@/, '')
        : ''
    const telegramUserId = data.telegramUserId
    const businessType =
      typeof data.businessType === 'string'
        ? data.businessType.trim()
        : 'agency_or_studio'
    const casesVolume =
      typeof data.casesVolume === 'string'
        ? data.casesVolume.trim()
        : '1_to_3'
    const currentProcess =
      typeof data.currentProcess === 'string'
        ? data.currentProcess.trim()
        : ''
    const feedbackText =
      typeof data.feedbackText === 'string' ? data.feedbackText.trim() : ''
    const source =
      typeof data.source === 'string' ? data.source.trim() : 'web'
    const consent = Boolean(data.consent)

    if (!email && !telegramUsername && !telegramUserId) {
      throw new HttpsError(
        'invalid-argument',
        'Укажите хотя бы один способ связи: почту или Telegram'
      )
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpsError('invalid-argument', 'Некорректный формат почты')
    }

    if (!consent) {
      throw new HttpsError(
        'invalid-argument',
        'Необходимо подтвердить согласие на обработку данных'
      )
    }

    const now = Date.now()
    const appPayload = {
      source,
      channel: source === 'telegram' ? 'telegram' : 'web',
      email: email || null,
      telegramUsername: telegramUsername || null,
      telegramUserId: telegramUserId || null,
      businessType,
      casesVolume,
      currentProcess,
      feedbackText: feedbackText || null,
      consent,
      status: 'new',
      createdAt: now,
      updatedAt: now,
      history: [
        {
          action: 'created',
          timestamp: now,
          performedBy: source === 'telegram' ? 'bot' : 'client',
        },
      ],
    }

    const docRef = await admin
      .firestore()
      .collection('beta_signups')
      .add(appPayload)

    return {
      success: true,
      id: docRef.id,
    }
  }
)

export const syncAdminClaims = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 15,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется авторизация')
    }

    const uid = request.auth.uid
    const email = (request.auth.token.email as string) || ''

    const userDoc = await admin.firestore().collection('users').doc(uid).get()
    const userData = userDoc.exists ? userDoc.data() : null

    const isAdmin = checkIsAdmin(
      email || userData?.email,
      userData?.telegramUserId
    )

    const existingClaims = request.auth.token
    const targetClaims = {
      ...existingClaims,
      admin: isAdmin,
      ...(isAdmin ? { access: 'active' } : {}),
    }

    await admin.auth().setCustomUserClaims(uid, targetClaims)

    return {
      isAdmin,
    }
  }
)

export const createInvite = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 30,
  },
  async (request) => {
    await requireAdmin(request as { auth?: { uid: string; token: Record<string, unknown> } })

    const { applicationId } = (request.data as { applicationId?: string }) || {}
    if (!applicationId || typeof applicationId !== 'string') {
      throw new HttpsError('invalid-argument', 'Не указан ID заявки')
    }

    const appRef = admin.firestore().collection('beta_signups').doc(applicationId)
    const appSnap = await appRef.get()

    if (!appSnap.exists) {
      throw new HttpsError('not-found', 'Заявка не найдена')
    }

    const appData = appSnap.data()!
    const existingCode = appData.inviteCode

    if (existingCode) {
      const existingInviteSnap = await admin
        .firestore()
        .collection('invites')
        .doc(existingCode)
        .get()

      if (existingInviteSnap.exists) {
        const invite = existingInviteSnap.data()!
        if (invite.status === 'issued' && invite.expiresAt > Date.now()) {
          return {
            success: true,
            invite,
            reused: true,
          }
        }
      }
    }

    const code = generateInviteCode()
    const expiresDays = parseInt(process.env.INVITE_EXPIRES_DAYS || '14', 10)
    const now = Date.now()
    const expiresAt = now + expiresDays * 24 * 60 * 60 * 1000

    const invitePayload = {
      code,
      status: 'issued',
      applicationId,
      expiresAt,
      channel: appData.channel || appData.source || 'web',
      email: appData.email || null,
      telegramUserId: appData.telegramUserId || null,
      createdBy: request.auth!.uid,
      createdAt: now,
    }

    await admin.firestore().collection('invites').doc(code).set(invitePayload)

    const updatedHistory = [
      ...(appData.history || []),
      {
        action: 'approved',
        timestamp: now,
        performedBy: request.auth!.token.email || request.auth!.uid,
        note: `Выдан инвайт ${code}`,
      },
    ]

    await appRef.update({
      status: 'approved',
      inviteCode: code,
      updatedAt: now,
      history: updatedHistory,
    })

    return {
      success: true,
      invite: invitePayload,
    }
  }
)

export const recreateInvite = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 30,
  },
  async (request) => {
    await requireAdmin(request as { auth?: { uid: string; token: Record<string, unknown> } })

    const { applicationId } = (request.data as { applicationId?: string }) || {}
    if (!applicationId || typeof applicationId !== 'string') {
      throw new HttpsError('invalid-argument', 'Не указан ID заявки')
    }

    const appRef = admin.firestore().collection('beta_signups').doc(applicationId)
    const appSnap = await appRef.get()

    if (!appSnap.exists) {
      throw new HttpsError('not-found', 'Заявка не найдена')
    }

    const appData = appSnap.data()!
    const oldCode = appData.inviteCode

    if (oldCode) {
      await admin
        .firestore()
        .collection('invites')
        .doc(oldCode)
        .update({
          status: 'revoked',
        })
        .catch(() => {})
    }

    const code = generateInviteCode()
    const expiresDays = parseInt(process.env.INVITE_EXPIRES_DAYS || '14', 10)
    const now = Date.now()
    const expiresAt = now + expiresDays * 24 * 60 * 60 * 1000

    const invitePayload = {
      code,
      status: 'issued',
      applicationId,
      expiresAt,
      channel: appData.channel || appData.source || 'web',
      email: appData.email || null,
      telegramUserId: appData.telegramUserId || null,
      createdBy: request.auth!.uid,
      createdAt: now,
    }

    await admin.firestore().collection('invites').doc(code).set(invitePayload)

    const updatedHistory = [
      ...(appData.history || []),
      {
        action: 'recreated',
        timestamp: now,
        performedBy: request.auth!.token.email || request.auth!.uid,
        note: `Перевыпущен инвайт ${code}`,
      },
    ]

    await appRef.update({
      status: 'approved',
      inviteCode: code,
      updatedAt: now,
      history: updatedHistory,
    })

    return {
      success: true,
      invite: invitePayload,
    }
  }
)

export const revokeInvite = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 15,
  },
  async (request) => {
    await requireAdmin(request as { auth?: { uid: string; token: Record<string, unknown> } })

    const { code, reason = '' } =
      (request.data as { code?: string; reason?: string }) || {}
    if (!code || typeof code !== 'string') {
      throw new HttpsError('invalid-argument', 'Не указан код')
    }

    const inviteRef = admin.firestore().collection('invites').doc(code)
    const inviteSnap = await inviteRef.get()

    if (!inviteSnap.exists) {
      throw new HttpsError('not-found', 'Приглашение не найдено')
    }

    const invite = inviteSnap.data()!
    await inviteRef.update({ status: 'revoked' })

    if (invite.applicationId) {
      const appRef = admin
        .firestore()
        .collection('beta_signups')
        .doc(invite.applicationId)
      const appSnap = await appRef.get()
      if (appSnap.exists) {
        const appData = appSnap.data()!
        const history = [
          ...(appData.history || []),
          {
            action: 'invite_revoked',
            timestamp: Date.now(),
            performedBy: request.auth!.token.email || request.auth!.uid,
            note: reason || 'Отозвано администратором',
          },
        ]
        await appRef.update({
          history,
          updatedAt: Date.now(),
        })
      }
    }

    return { success: true }
  }
)

export const markApplicationInvited = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 15,
  },
  async (request) => {
    await requireAdmin(request as { auth?: { uid: string; token: Record<string, unknown> } })

    const { applicationId } = (request.data as { applicationId?: string }) || {}
    if (!applicationId || typeof applicationId !== 'string') {
      throw new HttpsError('invalid-argument', 'Не указан ID заявки')
    }

    const appRef = admin.firestore().collection('beta_signups').doc(applicationId)
    const appSnap = await appRef.get()

    if (!appSnap.exists) {
      throw new HttpsError('not-found', 'Заявка не найдена')
    }

    const appData = appSnap.data()!
    const now = Date.now()
    const updatedHistory = [
      ...(appData.history || []),
      {
        action: 'invited',
        timestamp: now,
        performedBy: request.auth!.token.email || request.auth!.uid,
      },
    ]

    await appRef.update({
      status: 'invited',
      invitedAt: now,
      updatedAt: now,
      history: updatedHistory,
    })

    return { success: true }
  }
)

export const updateApplication = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 15,
  },
  async (request) => {
    await requireAdmin(request as { auth?: { uid: string; token: Record<string, unknown> } })

    const { applicationId, status, rejectReason, ownerNote } =
      (request.data as {
        applicationId?: string
        status?: string
        rejectReason?: string
        ownerNote?: string
      }) || {}

    if (!applicationId || typeof applicationId !== 'string') {
      throw new HttpsError('invalid-argument', 'Не указан ID заявки')
    }

    const appRef = admin.firestore().collection('beta_signups').doc(applicationId)
    const appSnap = await appRef.get()

    if (!appSnap.exists) {
      throw new HttpsError('not-found', 'Заявка не найдена')
    }

    const appData = appSnap.data()!
    const now = Date.now()
    const updates: Record<string, unknown> = {
      updatedAt: now,
    }

    if (typeof ownerNote === 'string') {
      updates.ownerNote = ownerNote
    }

    if (typeof rejectReason === 'string') {
      updates.rejectReason = rejectReason
    }

    if (status && status !== appData.status) {
      updates.status = status
      const history = [
        ...(appData.history || []),
        {
          action: `status_${status}`,
          timestamp: now,
          performedBy: request.auth!.token.email || request.auth!.uid,
          note: rejectReason || '',
        },
      ]
      updates.history = history
    }

    await appRef.update(updates)

    return { success: true }
  }
)

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
        userEmail: (request.auth.token.email as string) || '',
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

export const publishCase = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 30,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется авторизация')
    }

    const { caseId, consentConfirmed } = (request.data as {
      caseId?: string
      consentConfirmed?: boolean
    }) || {}

    if (!caseId) {
      throw new HttpsError('invalid-argument', 'Не указан ID кейса')
    }

    try {
      const db = admin.firestore()
      const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://proofflow.ru'
      const result = await executePublishCase({
        caseId,
        uid: request.auth.uid,
        consentConfirmed,
        db,
        publicBaseUrl,
      })
      return result
    } catch (err: unknown) {
      if (err instanceof PublishCaseError) {
        throw new HttpsError(err.code, err.message)
      }
      throw new HttpsError('internal', (err as Error)?.message || 'Ошибка публикации')
    }
  }
)

export const unpublishCase = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 15,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется авторизация')
    }

    const { caseId } = (request.data as { caseId?: string }) || {}
    if (!caseId) {
      throw new HttpsError('invalid-argument', 'Не указан ID кейса')
    }

    try {
      const db = admin.firestore()
      const result = await executeUnpublishCase({
        caseId,
        uid: request.auth.uid,
        db,
      })
      return result
    } catch (err: unknown) {
      if (err instanceof UnpublishCaseError) {
        throw new HttpsError(err.code, err.message)
      }
      throw new HttpsError('internal', (err as Error)?.message || 'Ошибка снятия с публикации')
    }
  }
)

export const createConsentRequest = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 15,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется авторизация')
    }

    const { caseId } = (request.data as { caseId?: string }) || {}
    if (!caseId) {
      throw new HttpsError('invalid-argument', 'Не указан ID кейса')
    }

    const db = admin.firestore()
    const caseRef = db.collection('cases').doc(caseId)
    const caseSnap = await caseRef.get()

    if (!caseSnap.exists) {
      throw new HttpsError('not-found', 'Кейс не найден')
    }

    const caseData = caseSnap.data()!
    if (caseData.ownerId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Нет доступа к этому кейсу')
    }

    const token = crypto.randomBytes(16).toString('hex')
    const now = Date.now()
    const draft = caseData.draft || {}

    const userSnap = await db.collection('users').doc(request.auth.uid).get()
    const companyName = caseData.branding?.companyName || userSnap.data()?.profile?.companyName || ''

    const consentRecord = {
      token,
      caseId,
      ownerId: request.auth.uid,
      clientLabel: caseData.clientLabel || '',
      status: 'pending',
      createdAt: now,
      anonymizedCase: {
        metric: draft.metric?.value || '',
        metricLabel: draft.metric?.label || '',
        problem: draft.problem || '',
        solution: draft.solution || '',
        result: draft.result || '',
        quote: draft.quote?.text || '',
        author: draft.quote?.authorLabel || 'Анна К.',
        company: companyName,
      },
    }

    await db.collection('consents').doc(token).set(consentRecord)

    await caseRef.update({
      clientConsentStatus: 'pending',
      updatedAt: now,
    })

    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://proofflow.ru'
    return {
      token,
      url: `${publicBaseUrl}/consent/${token}`,
    }
  }
)

export const getConsentByToken = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 15,
  },
  async (request) => {
    const { token } = (request.data as { token?: string }) || {}
    if (!token || typeof token !== 'string') {
      throw new HttpsError('invalid-argument', 'Не указан токен согласия')
    }

    const db = admin.firestore()
    const snap = await db.collection('consents').doc(token).get()

    if (!snap.exists) {
      throw new HttpsError('not-found', 'Запрос на согласие не найден')
    }

    const data = snap.data()!
    return {
      token: data.token,
      caseId: data.caseId,
      status: data.status,
      createdAt: data.createdAt,
      decidedAt: data.decidedAt || null,
      anonymizedCase: data.anonymizedCase,
    }
  }
)

export const submitClientConsent = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 15,
  },
  async (request) => {
    const { token, decision } = (request.data as {
      token?: string
      decision?: 'approved' | 'declined'
    }) || {}

    if (!token || typeof token !== 'string') {
      throw new HttpsError('invalid-argument', 'Не указан токен согласия')
    }

    if (decision !== 'approved' && decision !== 'declined') {
      throw new HttpsError('invalid-argument', 'Недопустимое решение')
    }

    const db = admin.firestore()
    const consentRef = db.collection('consents').doc(token)
    const consentSnap = await consentRef.get()

    if (!consentSnap.exists) {
      throw new HttpsError('not-found', 'Запрос на согласие не найден')
    }

    const consentData = consentSnap.data()!
    if (consentData.status === 'approved' || consentData.status === 'declined') {
      return {
        success: true,
        status: consentData.status,
        alreadyDecided: true,
      }
    }

    const now = Date.now()
    const clientIp = request.rawRequest.ip || (request.rawRequest.headers['x-forwarded-for'] as string) || 'unknown'
    const userAgent = (request.rawRequest.headers['user-agent'] as string) || ''

    await consentRef.update({
      status: decision,
      decidedAt: now,
      clientIp,
      userAgent,
    })

    const caseRef = db.collection('cases').doc(consentData.caseId)
    const caseSnap = await caseRef.get()

    if (caseSnap.exists) {
      if (decision === 'approved') {
        await caseRef.update({
          clientConsentStatus: 'approved',
          consentConfirmed: true,
          updatedAt: now,
        })
      } else {
        await caseRef.update({
          clientConsentStatus: 'declined',
          updatedAt: now,
        })
      }
    }

    return {
      success: true,
      status: decision,
    }
  }
)

export const deleteCase = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 60,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется авторизация')
    }

    const data = (request.data as Record<string, unknown>) || {}
    const caseId = typeof data.caseId === 'string' ? data.caseId.trim() : ''

    if (!caseId) {
      throw new HttpsError('invalid-argument', 'Не указан идентификатор кейса')
    }

    const db = admin.firestore()
    const caseRef = db.collection('cases').doc(caseId)
    const caseSnap = await caseRef.get()

    if (!caseSnap.exists) {
      throw new HttpsError('not-found', 'Кейс не найден')
    }

    const caseData = caseSnap.data() || {}
    const isAdminUser = request.auth.token?.admin === true
    const isOwner = caseData.ownerId === request.auth.uid

    if (!isOwner && !isAdminUser) {
      throw new HttpsError('permission-denied', 'Нет прав для удаления кейса')
    }

    const bucket = admin.storage().bucket()
    try {
      await bucket.deleteFiles({ prefix: `cases/${caseId}/`, force: true })
    } catch {
      void 0
    }

    await db.collection('publicCases').doc(caseId).delete().catch(() => {})

    const consentsSnap = await db
      .collection('consents')
      .where('caseId', '==', caseId)
      .get()
    const batch = db.batch()
    consentsSnap.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    batch.delete(caseRef)
    await batch.commit()

    return {
      success: true,
      caseId,
    }
  }
)

export const deleteAccount = onCall(
  {
    enforceAppCheck: false,
    timeoutSeconds: 120,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Требуется авторизация')
    }

    const uid = request.auth.uid
    const data = (request.data as Record<string, unknown>) || {}
    const confirmation = typeof data.confirmation === 'string' ? data.confirmation.trim().toUpperCase() : ''

    if (confirmation !== 'УДАЛИТЬ' && confirmation !== 'DELETE') {
      throw new HttpsError(
        'invalid-argument',
        'Для подтверждения удаления введите слово «УДАЛИТЬ»'
      )
    }

    const db = admin.firestore()
    const bucket = admin.storage().bucket()

    const casesSnap = await db.collection('cases').where('ownerId', '==', uid).get()
    for (const caseDoc of casesSnap.docs) {
      const caseId = caseDoc.id
      try {
        await bucket.deleteFiles({ prefix: `cases/${caseId}/`, force: true })
      } catch {
        continue
      }
      await db.collection('publicCases').doc(caseId).delete().catch(() => {})
      const consentsSnap = await db
        .collection('consents')
        .where('caseId', '==', caseId)
        .get()
      const cBatch = db.batch()
      consentsSnap.docs.forEach((c) => cBatch.delete(c.ref))
      await cBatch.commit().catch(() => {})
      await caseDoc.ref.delete().catch(() => {})
    }

    const userConsentsSnap = await db
      .collection('consents')
      .where('ownerId', '==', uid)
      .get()
    if (!userConsentsSnap.empty) {
      const uBatch = db.batch()
      userConsentsSnap.docs.forEach((c) => uBatch.delete(c.ref))
      await uBatch.commit().catch(() => {})
    }

    try {
      await bucket.deleteFiles({ prefix: `users/${uid}/`, force: true })
    } catch {
      void 0
    }

    await db.collection('users').doc(uid).delete().catch(() => {})

    try {
      await admin.auth().deleteUser(uid)
    } catch {
      void 0
    }

    return {
      success: true,
      uid,
    }
  }
)

