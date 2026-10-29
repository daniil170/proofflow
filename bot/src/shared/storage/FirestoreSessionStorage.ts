import type { Firestore } from 'firebase-admin/firestore'
import type { StorageAdapter } from 'grammy'
import { getAdminFirestore } from './firebase.js'

export class FirestoreSessionStorage<T> implements StorageAdapter<T> {
  private readonly db: Firestore

  constructor(db?: Firestore, private readonly collectionName = 'bot_sessions') {
    this.db = db || getAdminFirestore()
  }

  async read(key: string): Promise<T | undefined> {
    const snap = await this.db.collection(this.collectionName).doc(key).get()
    if (!snap.exists) return undefined
    const data = snap.data()
    return data?.session as T | undefined
  }

  async write(key: string, value: T): Promise<void> {
    await this.db.collection(this.collectionName).doc(key).set(
      {
        session: value,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
  }

  async delete(key: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(key).delete()
  }
}
