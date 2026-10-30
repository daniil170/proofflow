import type { Firestore } from 'firebase-admin/firestore'
import type { PublicCase } from '../../domain/publicCase.js'

export interface PublishCaseParams {
  caseId: string
  uid: string
  consentConfirmed?: boolean
  db: Firestore
  publicBaseUrl?: string
}

export interface PublishCaseResult {
  success: boolean
  caseId: string
  publicUrl: string
  publicCase: PublicCase
}

export class PublishCaseError extends Error {
  constructor(
    public code:
      | 'unauthenticated'
      | 'not-found'
      | 'permission-denied'
      | 'failed-precondition',
    message: string
  ) {
    super(message)
    this.name = 'PublishCaseError'
  }
}

export const executePublishCase = async (
  params: PublishCaseParams
): Promise<PublishCaseResult> => {
  const { caseId, uid, consentConfirmed = false, db, publicBaseUrl = 'https://proofflow.ru' } = params

  if (!uid) {
    throw new PublishCaseError('unauthenticated', 'Пользователь не авторизован')
  }

  if (!caseId || typeof caseId !== 'string') {
    throw new PublishCaseError('not-found', 'Идентификатор кейса не указан')
  }

  const caseRef = db.collection('cases').doc(caseId)
  const publicCaseRef = db.collection('publicCases').doc(caseId)

  const caseSnap = await caseRef.get()
  if (!caseSnap.exists) {
    throw new PublishCaseError('not-found', 'Кейс не найден')
  }

  const caseData = caseSnap.data()!

  if (caseData.ownerId !== uid) {
    throw new PublishCaseError('permission-denied', 'Нет прав на публикацию этого кейса')
  }

  if (caseData.status !== 'ready' && caseData.status !== 'published') {
    throw new PublishCaseError(
      'failed-precondition',
      'Кейс должен быть в статусе готовности (ready) перед публикацией'
    )
  }

  const isConsentConfirmed = Boolean(caseData.consentConfirmed || consentConfirmed)
  if (!isConsentConfirmed) {
    throw new PublishCaseError(
      'failed-precondition',
      'Необходимо подтвердить согласие клиента перед публикацией'
    )
  }

  let companyName = caseData.branding?.companyName || ''
  if (!companyName) {
    const userSnap = await db.collection('users').doc(uid).get()
    if (userSnap.exists) {
      companyName = userSnap.data()?.profile?.companyName || ''
    }
  }

  const draft = caseData.draft || {}
  const now = Date.now()

  const cardMessages = Array.isArray(caseData.selectedChatMessages) &&
    caseData.selectedChatMessages.length > 0
    ? caseData.selectedChatMessages.slice(0, 3)
    : Array.isArray(caseData.chatMessages)
    ? caseData.chatMessages.slice(0, 3)
    : []

  const rawAuthor = draft.quote?.authorLabel
  const author = !rawAuthor || rawAuthor === 'Анна К.' ? 'Клиент' : rawAuthor
  const headline = draft.headline?.text ||
    (draft.metric?.value ? `${draft.metric.value} ${draft.metric.label || ''}`.trim() : '')

  const publicCaseData: PublicCase = {
    id: caseId,
    headline,
    metric: draft.metric?.value || '',
    metricLabel: draft.metric?.label || '',
    problem: draft.problem || '',
    solution: draft.solution || '',
    result: draft.result || '',
    summaryRows: Array.isArray(draft.summaryRows) ? draft.summaryRows : [],
    quote: draft.quote?.text || '',
    author,
    authorRole: draft.quote?.authorRole || '',
    authorCompany: draft.quote?.authorCompany || '',
    messenger: caseData.messenger || 'unknown',
    cardMessages,
    tags: Array.isArray(draft.tags) ? draft.tags : [],
    selectedVariant: caseData.selectedVariant || 'dark',
    branding: {
      showLogo: caseData.branding?.showLogo ?? true,
      primaryColor: caseData.branding?.primaryColor || null,
      accentColor: caseData.branding?.accentColor || null,
      badgeText: caseData.branding?.badgeText || null,
      companyName,
      logoPath: caseData.branding?.logoPath || null,
    },
    companyName,
    title: headline || (draft.metric?.value ? `Кейс: ${draft.metric.value} ${draft.metric.label || ''}`.trim() : ''),
    publishedAt: caseData.publishedAt || now,
    isVerifiedByChat: Boolean(draft.quote?.evidenceId || draft.metric?.evidenceId),
    ogImageUrl: caseData.ogImageUrl || null,
  }

  await publicCaseRef.set(publicCaseData)

  await caseRef.update({
    status: 'published',
    publishedAt: publicCaseData.publishedAt,
    consentConfirmed: true,
    updatedAt: now,
  })

  return {
    success: true,
    caseId,
    publicUrl: `${publicBaseUrl}/c/${caseId}`,
    publicCase: publicCaseData,
  }
}
