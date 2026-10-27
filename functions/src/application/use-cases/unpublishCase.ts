import type { Firestore } from 'firebase-admin/firestore'

export interface UnpublishCaseParams {
  caseId: string
  uid: string
  db: Firestore
}

export interface UnpublishCaseResult {
  success: boolean
  caseId: string
}

export class UnpublishCaseError extends Error {
  constructor(
    public code:
      | 'unauthenticated'
      | 'not-found'
      | 'permission-denied'
      | 'failed-precondition',
    message: string
  ) {
    super(message)
    this.name = 'UnpublishCaseError'
  }
}

export const executeUnpublishCase = async (
  params: UnpublishCaseParams
): Promise<UnpublishCaseResult> => {
  const { caseId, uid, db } = params

  if (!uid) {
    throw new UnpublishCaseError('unauthenticated', 'Пользователь не авторизован')
  }

  if (!caseId || typeof caseId !== 'string') {
    throw new UnpublishCaseError('not-found', 'Идентификатор кейса не указан')
  }

  const caseRef = db.collection('cases').doc(caseId)
  const publicCaseRef = db.collection('publicCases').doc(caseId)

  const caseSnap = await caseRef.get()
  if (!caseSnap.exists) {
    throw new UnpublishCaseError('not-found', 'Кейс не найден')
  }

  const caseData = caseSnap.data()!

  if (caseData.ownerId !== uid) {
    throw new UnpublishCaseError('permission-denied', 'Нет прав на изменение этого кейса')
  }

  await publicCaseRef.delete()

  await caseRef.update({
    status: 'ready',
    publishedAt: null,
    updatedAt: Date.now(),
  })

  return {
    success: true,
    caseId,
  }
}
