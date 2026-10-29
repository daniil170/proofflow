import { doc, getDoc, setDoc, deleteDoc, type Firestore } from 'firebase/firestore'
import type { StorageAdapter } from 'grammy'
import { getFirestoreDb } from './firebase.js'

export class FirestoreSessionStorage<T> implements StorageAdapter<T> {
  private readonly db: Firestore

  constructor(db?: Firestore, private readonly collectionName = 'bot_sessions') {
    this.db = db || getFirestoreDb()
  }

  async read(key: string): Promise<T | undefined> {
    const docRef = doc(this.db, this.collectionName, key)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return undefined
    const data = snap.data()
    return data?.session as T | undefined
  }

  async write(key: string, value: T): Promise<void> {
    const docRef = doc(this.db, this.collectionName, key)
    await setDoc(
      docRef,
      {
        session: value,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
  }

  async delete(key: string): Promise<void> {
    const docRef = doc(this.db, this.collectionName, key)
    await deleteDoc(docRef)
  }
}
