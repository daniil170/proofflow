import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirebaseApp } from '../firebase/app.js'
import { INITIAL_EXAMPLE_CASES } from './types.js'

const COLLECTION_NAME = 'cases'

const getDbInstance = () => getFirestore(getFirebaseApp())
const getFunctionsInstance = () => getFunctions(getFirebaseApp())

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

  async countByOwner(ownerId) {
    if (!ownerId) return 0
    const db = getDbInstance()
    const casesCollection = collection(db, COLLECTION_NAME)
    const casesQuery = query(casesCollection, where('ownerId', '==', ownerId))
    const snapshot = await getCountFromServer(casesQuery)
    return snapshot.data().count
  },

  async saveFeedback({ caseId, rating, comment, userId }) {
    const db = getDbInstance()
    const payload = {
      caseId,
      rating,
      comment: comment || '',
      userId: userId || null,
      createdAt: Date.now(),
    }
    const docRef = await addDoc(collection(db, 'feedback'), payload)
    return {
      id: docRef.id,
      ...payload,
    }
  },

  async publishCase(caseId, consentConfirmed = false) {
    const functions = getFunctionsInstance()
    const call = httpsCallable(functions, 'publishCase')
    const res = await call({ caseId, consentConfirmed })
    return res.data
  },

  async unpublishCase(caseId) {
    const functions = getFunctionsInstance()
    const call = httpsCallable(functions, 'unpublishCase')
    const res = await call({ caseId })
    return res.data
  },

  async getPublicCase(caseId) {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
    const region = import.meta.env.VITE_FIREBASE_REGION || 'us-central1'
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

    let url = `https://${region}-${projectId}.cloudfunctions.net/getPublicCase?id=${encodeURIComponent(caseId)}`
    if (isLocal) {
      url = `http://127.0.0.1:5001/${projectId}/${region}/getPublicCase?id=${encodeURIComponent(caseId)}`
    }

    try {
      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Кейс недоступен или еще не опубликован')
      }
      return await response.json()
    } catch {
      return null
    }
  },
})
