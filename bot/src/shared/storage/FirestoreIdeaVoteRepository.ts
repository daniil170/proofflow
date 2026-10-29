import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { IdeaVote } from '../../entities/index.js'
import { getAdminFirestore } from './firebase.js'
import type { IdeaVoteRepository } from './IdeaVoteRepository.js'

const COLLECTION_NAME = 'idea_votes'

export class FirestoreIdeaVoteRepository implements IdeaVoteRepository {
  private readonly db: Firestore

  constructor(db?: Firestore) {
    this.db = db || getAdminFirestore()
  }

  private makeDocId(ideaId: string, telegramUserId: number): string {
    return `${ideaId}_${telegramUserId}`
  }

  async addVote(ideaId: string, telegramUserId: number): Promise<boolean> {
    const docId = this.makeDocId(ideaId, telegramUserId)
    const ref = this.db.collection(COLLECTION_NAME).doc(docId)
    const existing = await ref.get()
    if (existing.exists) {
      return false
    }

    await ref.set({
      ideaId,
      telegramUserId,
      createdAt: FieldValue.serverTimestamp(),
    })
    return true
  }

  async removeVote(ideaId: string, telegramUserId: number): Promise<boolean> {
    const docId = this.makeDocId(ideaId, telegramUserId)
    const ref = this.db.collection(COLLECTION_NAME).doc(docId)
    const existing = await ref.get()
    if (!existing.exists) {
      return false
    }

    await ref.delete()
    return true
  }

  async hasVoted(ideaId: string, telegramUserId: number): Promise<boolean> {
    const docId = this.makeDocId(ideaId, telegramUserId)
    const ref = this.db.collection(COLLECTION_NAME).doc(docId)
    const snap = await ref.get()
    return snap.exists
  }

  async findVotesByUser(telegramUserId: number): Promise<IdeaVote[]> {
    const snapshot = await this.db
      .collection(COLLECTION_NAME)
      .where('telegramUserId', '==', telegramUserId)
      .get()

    const votes: IdeaVote[] = []
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() || {}
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
    const snapshot = await this.db
      .collection(COLLECTION_NAME)
      .where('telegramUserId', '==', telegramUserId)
      .get()

    const removed: IdeaVote[] = []
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() || {}
      removed.push({
        id: docSnap.id,
        ideaId: data.ideaId,
        telegramUserId: data.telegramUserId,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
      })
      await docSnap.ref.delete()
    }

    return removed
  }

  async deleteByIdeaId(ideaId: string): Promise<number> {
    const snapshot = await this.db
      .collection(COLLECTION_NAME)
      .where('ideaId', '==', ideaId)
      .get()

    let count = 0
    for (const docSnap of snapshot.docs) {
      await docSnap.ref.delete()
      count += 1
    }

    return count
  }
}
