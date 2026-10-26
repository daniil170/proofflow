import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getFirebaseApp } from '../firebase/app.js'
import { INITIAL_EXAMPLE_CASES } from './types.js'

const COLLECTION_NAME = 'cases'

const getDbInstance = () => getFirestore(getFirebaseApp())

const normalizeDoc = (docSnapshot) => {
  if (!docSnapshot.exists()) {
    return null
  }
  const data = docSnapshot.data()
  return {
    id: docSnapshot.id,
    ...data,
  }
}

export const firestoreCaseRepository = Object.freeze({
  subscribeByOwner(ownerId, onUpdate, onError) {
    const db = getDbInstance()
    const casesCollection = collection(db, COLLECTION_NAME)
    const casesQuery = query(casesCollection, where('ownerId', '==', ownerId))

    return onSnapshot(
      casesQuery,
      (snapshot) => {
        const items = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .sort((a, b) => {
            const timeA =
              typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis?.() ?? 0)
            const timeB =
              typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis?.() ?? 0)
            return timeB - timeA
          })
        onUpdate(items)
      },
      (error) => {
        if (onError) {
          onError(error)
        }
      }
    )
  },

  subscribeById(id, onUpdate, onError) {
    const db = getDbInstance()
    const docRef = doc(db, COLLECTION_NAME, id)

    return onSnapshot(
      docRef,
      (docSnap) => {
        onUpdate(normalizeDoc(docSnap))
      },
      (error) => {
        if (onError) {
          onError(error)
        }
      }
    )
  },

  async getById(id) {
    const db = getDbInstance()
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    return normalizeDoc(docSnap)
  },

  async create(caseData) {
    const db = getDbInstance()
    const casesCollection = collection(db, COLLECTION_NAME)
    const timestamp = Date.now()
    const payload = {
      ...caseData,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const docRef = await addDoc(casesCollection, payload)
    return {
      id: docRef.id,
      ...payload,
    }
  },

  async update(id, partialData) {
    const db = getDbInstance()
    const docRef = doc(db, COLLECTION_NAME, id)
    const payload = {
      ...partialData,
      updatedAt: Date.now(),
    }
    await updateDoc(docRef, payload)
    return {
      id,
      ...payload,
    }
  },

  async seedExamples(ownerId) {
    const created = []
    for (const example of INITIAL_EXAMPLE_CASES) {
      const item = await this.create({
        ...example,
        ownerId,
      })
      created.push(item)
    }
    return created
  },
})
