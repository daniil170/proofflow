import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import type { IdeaVote } from '../../entities/index.js'
import { getFirestoreDb } from './firebase.js'
import type { IdeaVoteRepository } from './IdeaVoteRepository.js'

const COLLECTION_NAME = 'idea_votes'

export class FirestoreIdeaVoteRepository implements IdeaVoteRepository {
  private readonly db: Firestore

  constructor(db = getFirestoreDb()) {
    this.db = db
  }

  private makeDocId(ideaId: string, telegramUserId: number): string {
    return `${ideaId}_${telegramUserId}`
  }

  async addVote(ideaId: string, telegramUserId: number): Promise<boolean> {
    const docId = this.makeDocId(ideaId, telegramUserId)
    const ref = doc(this.db, COLLECTION_NAME, docId)
    const existing = await getDoc(ref)
    if (existing.exists()) {
      return false
    }

    await setDoc(ref, {
      ideaId,
      telegramUserId,
      createdAt: serverTimestamp(),
    })
    return true
  }

  async removeVote(ideaId: string, telegramUserId: number): Promise<boolean> {
    const docId = this.makeDocId(ideaId, telegramUserId)
    const ref = doc(this.db, COLLECTION_NAME, docId)
    const existing = await getDoc(ref)
    if (!existing.exists()) {
      return false
    }

    await deleteDoc(ref)
    return true
  }

  async hasVoted(ideaId: string, telegramUserId: number): Promise<boolean> {
    const docId = this.makeDocId(ideaId, telegramUserId)
    const ref = doc(this.db, COLLECTION_NAME, docId)
    const snap = await getDoc(ref)
    return snap.exists()
  }

  async findVotesByUser(telegramUserId: number): Promise<IdeaVote[]> {
    const q = query(
      collection(this.db, COLLECTION_NAME),
      where('telegramUserId', '==', telegramUserId)
    )
    const snapshot = await getDocs(q)
    const votes: IdeaVote[] = []

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      votes.push({
        id: docSnap.id,
        ideaId: data.ideaId,
        telegramUserId: data.telegramUserId,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
      })
    }

    return votes
  }

  async deleteByTelegramUserId(telegramUserId: number): Promise<IdeaVote[]> {
    const q = query(
      collection(this.db, COLLECTION_NAME),
      where('telegramUserId', '==', telegramUserId)
    )
    const snapshot = await getDocs(q)
    const removed: IdeaVote[] = []

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      removed.push({
        id: docSnap.id,
        ideaId: data.ideaId,
        telegramUserId: data.telegramUserId,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
      })
      await deleteDoc(docSnap.ref)
    }

    return removed
  }

  async deleteByIdeaId(ideaId: string): Promise<number> {
    const q = query(
      collection(this.db, COLLECTION_NAME),
      where('ideaId', '==', ideaId)
    )
    const snapshot = await getDocs(q)
    let count = 0

    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref)
      count += 1
    }

    return count
  }
}
