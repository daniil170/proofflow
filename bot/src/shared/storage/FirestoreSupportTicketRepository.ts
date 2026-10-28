import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import type { SupportTicket, TicketMessage } from '../../entities/index.js'
import { getFirestoreDb } from './firebase.js'
import type { SupportTicketRepository } from './SupportTicketRepository.js'

const COLLECTION_NAME = 'support_tickets'

export class FirestoreSupportTicketRepository implements SupportTicketRepository {
  private readonly db: Firestore

  constructor(db = getFirestoreDb()) {
    this.db = db
  }

  async create(
    ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'lastMessageAt'>
  ): Promise<SupportTicket> {
    const docRef = await addDoc(collection(this.db, COLLECTION_NAME), {
      ...ticketData,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
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
    const docSnap = await getDoc(doc(this.db, COLLECTION_NAME, id))
    if (!docSnap.exists()) return null

    const data = docSnap.data()
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
    const q = query(
      collection(this.db, COLLECTION_NAME),
      where('telegramUserId', '==', telegramUserId),
      where('status', '==', 'open')
    )
    const snapshot = await getDocs(q)
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
    const ref = doc(this.db, COLLECTION_NAME, id)
    const payload: Record<string, unknown> = { ...updates }
    delete payload.id

    await updateDoc(ref, payload)
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
    const ref = doc(this.db, COLLECTION_NAME, id)
    await updateDoc(ref, {
      messages: arrayUnion(message),
      lastMessageAt: serverTimestamp(),
    })
    const updated = await this.findById(id)
    if (!updated) {
      throw new Error(`Ticket with id ${id} not found after appendMessage`)
    }
    return updated
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
}
