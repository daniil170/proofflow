import { getApps, initializeApp } from 'firebase/app'
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore'

const COLLECTION_NAME = 'beta_signups'

const getFirebaseConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})

const getDbInstance = () => {
  const apps = getApps()
  const app = apps.length > 0 ? apps[0] : initializeApp(getFirebaseConfig())
  return getFirestore(app)
}

export const firebaseBetaSignupGateway = Object.freeze({
  async submit(payload) {
    const db = getDbInstance()
    const signupsCollection = collection(db, COLLECTION_NAME)

    const docRef = await addDoc(signupsCollection, {
      ...payload,
      createdAt: serverTimestamp(),
    })

    return {
      success: true,
      id: docRef.id,
    }
  },
})
