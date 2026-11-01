import { getFirestore } from 'firebase-admin/firestore'
import {
  Case,
  CaseDraft,
  Evidence,
  MessengerType,
  PersistedChatMessage,
  PipelineStage,
} from '../../domain/types.js'
import { CaseRepositoryPort } from '../ports/CaseRepositoryPort.js'

export class FirestoreCaseRepository implements CaseRepositoryPort {
  private collectionName = 'cases'

  private getDb() {
    return getFirestore()
  }

  async getCase(caseId: string): Promise<Case | null> {
    const docSnap = await this.getDb().collection(this.collectionName).doc(caseId).get()
    if (!docSnap.exists) {
      return null
    }
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Case
  }

  async updateStage(
    caseId: string,
    stage: PipelineStage,
    percent: number,
    message?: string
  ): Promise<void> {
    await this.getDb()
      .collection(this.collectionName)
      .doc(caseId)
      .update({
        stage,
        stageProgress: percent,
        stageMessage: message || '',
        updatedAt: Date.now(),
      })
  }

  async failCase(
    caseId: string,
    stage: PipelineStage,
    error: string
  ): Promise<void> {
    await this.getDb()
      .collection(this.collectionName)
      .doc(caseId)
      .update({
        status: 'failed',
        stage,
        failReason: error,
        updatedAt: Date.now(),
      })
  }

  async saveDraft(
    caseId: string,
    draft: CaseDraft,
    evidences: Evidence[],
    finalStatus: 'review' | 'ready' = 'review',
    options?: {
      chatMessages?: PersistedChatMessage[]
      selectedChatMessages?: PersistedChatMessage[]
      messenger?: MessengerType
    }
  ): Promise<void> {
    const updatePayload: Record<string, unknown> = {
      draft,
      evidences,
      status: finalStatus,
      stage: 'done',
      stageProgress: 100,
      updatedAt: Date.now(),
    }
    if (options?.chatMessages !== undefined) {
      updatePayload.chatMessages = options.chatMessages
    }
    if (options?.selectedChatMessages !== undefined) {
      updatePayload.selectedChatMessages = options.selectedChatMessages
    }
    if (options?.messenger !== undefined) {
      updatePayload.messenger = options.messenger
    }

    await this.getDb()
      .collection(this.collectionName)
      .doc(caseId)
      .update(updatePayload)
  }

  async countCasesByOwner(ownerId: string): Promise<number> {
    const snapshot = await this.getDb()
      .collection(this.collectionName)
      .where('ownerId', '==', ownerId)
      .count()
      .get()
    return snapshot.data().count
  }

  async getUserLimits(userId: string): Promise<{
    caseLimit?: number
    accessExpiresAt?: number | null
    accessStatus?: string
  } | null> {
    const userSnap = await this.getDb().collection('users').doc(userId).get()
    if (!userSnap.exists) {
      return null
    }
    const data = userSnap.data()
    return {
      caseLimit: typeof data?.caseLimit === 'number' ? data.caseLimit : undefined,
      accessExpiresAt:
        typeof data?.accessExpiresAt === 'number'
          ? data.accessExpiresAt
          : data?.accessExpiresAt === null
            ? null
            : undefined,
      accessStatus: data?.accessStatus,
    }
  }
}
