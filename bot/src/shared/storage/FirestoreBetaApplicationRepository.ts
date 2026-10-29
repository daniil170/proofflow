import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { BetaApplication } from '../../entities/index.js'
import { getAdminFirestore } from './firebase.js'
import type { BetaApplicationRepository } from './BetaApplicationRepository.js'

const COLLECTION_NAME = 'beta_signups'

export class FirestoreBetaApplicationRepository implements BetaApplicationRepository {
  private readonly db: Firestore

  constructor(db?: Firestore) {
    this.db = db || getAdminFirestore()
  }

  async findByTelegramUserId(telegramUserId: number): Promise<BetaApplication | null> {
    const snapshot = await this.db
      .collection(COLLECTION_NAME)
      .where('source', '==', 'telegram')
      .where('telegramUserId', '==', telegramUserId)
      .get()

    if (snapshot.empty) return null

    const docSnapshot = snapshot.docs[0]
    const data = docSnapshot.data()
    return {
      id: docSnapshot.id,
      source: data.source,
      channel: data.channel || data.source,
      status: data.status,
      email: data.email,
      currentProcess: data.currentProcess,
      deepLink: data.deepLink,
      telegramUserId: data.telegramUserId,
      telegramUsername: data.telegramUsername,
      businessType: data.businessType,
      casesVolume: data.casesVolume,
      feedbackText: data.feedbackText,
      voiceAttachment: data.voiceAttachment,
      consent: data.consent,
      unsubscribed: data.unsubscribed,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
    }
  }

  async create(
    application: Omit<BetaApplication, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BetaApplication> {
    const docData = {
      ...application,
      channel: 'telegram',
      source: 'telegram',
      status: application.status || 'new',
      email: null,
      currentProcess: application.feedbackText || application.currentProcess || '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      history: [
        {
          action: 'created',
          timestamp: Date.now(),
          performedBy: 'bot',
        },
      ],
    }
    const docRef = await this.db.collection(COLLECTION_NAME).add(docData)
    return {
      ...application,
      id: docRef.id,
      channel: 'telegram',
      source: 'telegram',
      status: 'new',
      email: null,
      currentProcess: application.feedbackText || application.currentProcess || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  async update(id: string, updates: Partial<BetaApplication>): Promise<BetaApplication> {
    await this.db
      .collection(COLLECTION_NAME)
      .doc(id)
      .update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      })
    return {
      id,
      ...(updates as BetaApplication),
    }
  }

  async deleteByTelegramUserId(telegramUserId: number): Promise<boolean> {
    const snapshot = await this.db
      .collection(COLLECTION_NAME)
      .where('source', '==', 'telegram')
      .where('telegramUserId', '==', telegramUserId)
      .get()

    if (snapshot.empty) return false

    const deletePromises = snapshot.docs.map((d) => d.ref.delete())
    await Promise.all(deletePromises)
    return true
  }

  async setUnsubscribed(telegramUserId: number, unsubscribed: boolean): Promise<boolean> {
    const snapshot = await this.db
      .collection(COLLECTION_NAME)
      .where('source', '==', 'telegram')
      .where('telegramUserId', '==', telegramUserId)
      .get()

    if (snapshot.empty) return false

    const updatePromises = snapshot.docs.map((d) =>
      d.ref.update({
        unsubscribed,
        updatedAt: FieldValue.serverTimestamp(),
      })
    )
    await Promise.all(updatePromises)
    return true
  }
}
