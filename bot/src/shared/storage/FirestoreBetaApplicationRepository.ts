import { getApps, initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import type { BetaApplication } from '../../entities/index.js'
import { config } from '../config.js'
import type { BetaApplicationRepository } from './BetaApplicationRepository.js'

const COLLECTION_NAME = 'beta_signups'

export class FirestoreBetaApplicationRepository implements BetaApplicationRepository {
  private readonly db: Firestore

  constructor() {
    const apps = getApps()
    const app =
      apps.length > 0
        ? apps[0]
        : initializeApp({
            apiKey: config.firebase.apiKey,
            authDomain: config.firebase.authDomain,
            projectId: config.firebase.projectId,
            storageBucket: config.firebase.storageBucket,
            messagingSenderId: config.firebase.messagingSenderId,
            appId: config.firebase.appId,
          })
    this.db = getFirestore(app)
  }

  async findByTelegramUserId(telegramUserId: number): Promise<BetaApplication | null> {
    const q = query(
      collection(this.db, COLLECTION_NAME),
      where('source', '==', 'telegram'),
      where('telegramUserId', '==', telegramUserId)
    )
    const snapshot = await getDocs(q)
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
    const col = collection(this.db, COLLECTION_NAME)
    const docData = {
      ...application,
      channel: 'telegram',
      source: 'telegram',
      status: application.status || 'new',
      email: null,
      currentProcess: application.feedbackText || application.currentProcess || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      history: [
        {
          action: 'created',
          timestamp: Date.now(),
          performedBy: 'bot',
        },
      ],
    }
    const docRef = await addDoc(col, docData)
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
    const docRef = doc(this.db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
    return {
      id,
      ...(updates as BetaApplication),
    }
  }

  async deleteByTelegramUserId(telegramUserId: number): Promise<boolean> {
    const q = query(
      collection(this.db, COLLECTION_NAME),
      where('source', '==', 'telegram'),
      where('telegramUserId', '==', telegramUserId)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return false

    const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref))
    await Promise.all(deletePromises)
    return true
  }

  async setUnsubscribed(telegramUserId: number, unsubscribed: boolean): Promise<boolean> {
    const q = query(
      collection(this.db, COLLECTION_NAME),
      where('source', '==', 'telegram'),
      where('telegramUserId', '==', telegramUserId)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return false

    const updatePromises = snapshot.docs.map((d) =>
      updateDoc(d.ref, {
        unsubscribed,
        updatedAt: serverTimestamp(),
      })
    )
    await Promise.all(updatePromises)
    return true
  }
}
