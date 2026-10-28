import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import type { Idea } from '../../entities/index.js'
import { getFirestoreDb } from './firebase.js'
import type { IdeaRepository } from './IdeaRepository.js'

const COLLECTION_NAME = 'ideas'

export class FirestoreIdeaRepository implements IdeaRepository {
  private readonly db: Firestore

  constructor(db = getFirestoreDb()) {
    this.db = db
  }

  async create(
    ideaData: Omit<Idea, 'id' | 'createdAt' | 'votesCount'>
  ): Promise<Idea> {
    const docRef = await addDoc(collection(this.db, COLLECTION_NAME), {
      ...ideaData,
      votesCount: 0,
      createdAt: serverTimestamp(),
    })

    const now = new Date().toISOString()
    return {
      ...ideaData,
      id: docRef.id,
      votesCount: 0,
      createdAt: now,
    }
  }

  async findById(id: string): Promise<Idea | null> {
    const docSnap = await getDoc(doc(this.db, COLLECTION_NAME, id))
    if (!docSnap.exists()) return null

    const data = docSnap.data()
    return {
      id: docSnap.id,
      telegramUserId: data.telegramUserId,
      category: data.category,
      text: data.text,
      voiceFileId: data.voiceFileId,
      context: data.context,
      moderationStatus: data.moderationStatus,
      votesCount: data.votesCount || 0,
      adminMessageId: data.adminMessageId,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
    }
  }

  async findByAdminMessageId(adminMessageId: number): Promise<Idea | null> {
    const q = query(
      collection(this.db, COLLECTION_NAME),
      where('adminMessageId', '==', adminMessageId)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null

    const docSnap = snapshot.docs[0]
    const data = docSnap.data()
    return {
      id: docSnap.id,
      telegramUserId: data.telegramUserId,
      category: data.category,
      text: data.text,
      voiceFileId: data.voiceFileId,
      context: data.context,
      moderationStatus: data.moderationStatus,
      votesCount: data.votesCount || 0,
      adminMessageId: data.adminMessageId,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
    }
  }

  async update(id: string, updates: Partial<Idea>): Promise<Idea> {
    const ref = doc(this.db, COLLECTION_NAME, id)
    const payload: Record<string, unknown> = { ...updates }
    delete payload.id

    await updateDoc(ref, payload)
    const updated = await this.findById(id)
    if (!updated) {
      throw new Error(`Idea with id ${id} not found after update`)
    }
    return updated
  }

  async findPublicTextIdeas(
    limit: number,
    offset: number
  ): Promise<{ items: Idea[]; total: number }> {
    const q = query(
      collection(this.db, COLLECTION_NAME),
      where('moderationStatus', '==', 'public')
    )
    const snapshot = await getDocs(q)
    const all: Idea[] = []

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      if (data.text && typeof data.text === 'string' && data.text.trim().length > 0) {
        all.push({
          id: docSnap.id,
          telegramUserId: data.telegramUserId,
          category: data.category,
          text: data.text,
          voiceFileId: data.voiceFileId,
          context: data.context,
          moderationStatus: data.moderationStatus,
          votesCount: data.votesCount || 0,
          adminMessageId: data.adminMessageId,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        })
      }
    }

    all.sort((a, b) => {
      if (b.votesCount !== a.votesCount) {
        return b.votesCount - a.votesCount
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const total = all.length
    const items = all.slice(offset, offset + limit)
    return { items, total }
  }

  async countDailyByUser(telegramUserId: number, since: Date): Promise<number> {
    const q = query(
      collection(this.db, COLLECTION_NAME),
      where('telegramUserId', '==', telegramUserId)
    )
    const snapshot = await getDocs(q)
    const sinceTime = since.getTime()
    let count = 0

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      const createdTime = data.createdAt?.toDate
        ? data.createdAt.toDate().getTime()
        : new Date(data.createdAt || 0).getTime()

      if (createdTime >= sinceTime) {
        count += 1
      }
    }

    return count
  }

  async deleteByTelegramUserId(telegramUserId: number): Promise<number> {
    const q = query(
      collection(this.db, COLLECTION_NAME),
      where('telegramUserId', '==', telegramUserId)
    )
    const snapshot = await getDocs(q)
    let deleted = 0

    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref)
      deleted += 1
    }

    return deleted
  }

  async incrementVote(id: string, delta: number): Promise<number> {
    const ref = doc(this.db, COLLECTION_NAME, id)
    await updateDoc(ref, {
      votesCount: increment(delta),
    })
    const updated = await this.findById(id)
    return updated?.votesCount ?? 0
  }
}
