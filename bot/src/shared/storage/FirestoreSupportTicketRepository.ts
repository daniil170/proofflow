import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { SupportTicket, TicketMessage } from '../../entities/index.js'
import { getAdminFirestore } from './firebase.js'
import type { SupportTicketRepository } from './SupportTicketRepository.js'

const COLLECTION_NAME = 'support_tickets'

export class FirestoreSupportTicketRepository implements SupportTicketRepository {
  private readonly db: Firestore

  constructor(db?: Firestore) {
    this.db = db || getAdminFirestore()
  }

  async create(
    ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'lastMessageAt'>
  ): Promise<SupportTicket> {
    const docRef = await this.db.collection(COLLECTION_NAME).add({
      ...ticketData,
      createdAt: FieldValue.serverTimestamp(),
      lastMessageAt: FieldValue.serverTimestamp(),
    })

    const now = new Date().toISOString()
    return {
      ...ticketData,
      id: docRef.id,
      createdAt: now,
      lastMessageAt: now,
    }
  }

  async findById(id: string): Promise<SupportTicket | null> {
    const docSnap = await this.db.collection(COLLECTION_NAME).doc(id).get()
    if (!docSnap.exists) return null

    const data = docSnap.data() || {}
    return {
      id: docSnap.id,
      telegramUserId: data.telegramUserId,
      username: data.username,
      topic: data.topic,
      source: data.source,
      status: data.status,
      messages: data.messages || [],
      adminMessageId: data.adminMessageId,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
      lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString() || data.lastMessageAt || new Date().toISOString(),
    }
  }

  async findByAdminMessageId(adminMessageId: number): Promise<SupportTicket | null> {
    const snapshot = await this.db
      .collection(COLLECTION_NAME)
      .where('adminMessageId', '==', adminMessageId)
      .get()

    if (snapshot.empty) return null

    const docSnap = snapshot.docs[0]
    const data = docSnap.data() || {}
    return {
      id: docSnap.id,
      telegramUserId: data.telegramUserId,
      username: data.username,
      topic: data.topic,
      source: data.source,
      status: data.status,
      messages: data.messages || [],
      adminMessageId: data.adminMessageId,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
      lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString() || data.lastMessageAt || new Date().toISOString(),
    }
  }

  async findOpenByTelegramUserId(
    telegramUserId: number
  ): Promise<SupportTicket | null> {
    const snapshot = await this.db
      .collection(COLLECTION_NAME)
      .where('telegramUserId', '==', telegramUserId)
      .where('status', '==', 'open')
      .get()

    if (snapshot.empty) return null

    const DAY_MS = 24 * 60 * 60 * 1000
    const now = Date.now()

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      const lastMessageTime = data.lastMessageAt?.toDate
        ? data.lastMessageAt.toDate().getTime()
        : new Date(data.lastMessageAt || 0).getTime()

      if (now - lastMessageTime <= DAY_MS) {
        return {
          id: docSnap.id,
          telegramUserId: data.telegramUserId,
          username: data.username,
          topic: data.topic,
          source: data.source,
          status: data.status,
          messages: data.messages || [],
          adminMessageId: data.adminMessageId,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString() || data.lastMessageAt,
        }
      }
    }

    return null
  }

  async update(
    id: string,
    updates: Partial<SupportTicket>
  ): Promise<SupportTicket> {
    const payload: Record<string, unknown> = { ...updates }
    delete payload.id

    await this.db.collection(COLLECTION_NAME).doc(id).update(payload)
    const updated = await this.findById(id)
    if (!updated) {
      throw new Error(`Ticket with id ${id} not found after update`)
    }
    return updated
  }

  async appendMessage(
    id: string,
    message: TicketMessage
  ): Promise<SupportTicket> {
    await this.db.collection(COLLECTION_NAME).doc(id).update({
      messages: FieldValue.arrayUnion(message),
      lastMessageAt: FieldValue.serverTimestamp(),
    })
    const updated = await this.findById(id)
    if (!updated) {
      throw new Error(`Ticket with id ${id} not found after appendMessage`)
    }
    return updated
  }

  async countDailyByUser(telegramUserId: number, since: Date): Promise<number> {
    const snapshot = await this.db
      .collection(COLLECTION_NAME)
      .where('telegramUserId', '==', telegramUserId)
      .get()

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
    const snapshot = await this.db
      .collection(COLLECTION_NAME)
      .where('telegramUserId', '==', telegramUserId)
      .get()

    let deleted = 0
    for (const docSnap of snapshot.docs) {
      await docSnap.ref.delete()
      deleted += 1
    }

    return deleted
  }
}
