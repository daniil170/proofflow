import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirebaseApp } from '../firebase/app.js'

const getDbInstance = () => getFirestore(getFirebaseApp())
const getFunctionsInstance = () => getFunctions(getFirebaseApp())

export const firestoreUserRepository = Object.freeze({
  async getUser(uid) {
    if (!uid) return null
    const db = getDbInstance()
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    return {
      id: snap.id,
      ...snap.data(),
    }
  },

  subscribeToUser(uid, callback, onError) {
    if (!uid) {
      callback(null)
      return () => {}
    }
    const db = getDbInstance()
    const userRef = doc(db, 'users', uid)

    return onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          callback(null)
        } else {
          callback({
            id: snap.id,
            ...snap.data(),
          })
        }
      },
      (error) => {
        if (typeof onError === 'function') {
          onError(error)
        } else {
          console.error('Ошибка подписки на пользователя:', error)
        }
      }
    )
  },

  async updateProfile(uid, profile) {
    const db = getDbInstance()
    const userRef = doc(db, 'users', uid)
    await setDoc(
      userRef,
      {
        profile,
        updatedAt: Date.now(),
      },
      { merge: true }
    )
    return profile
  },

  async acceptConsent(uid, consent) {
    const db = getDbInstance()
    const userRef = doc(db, 'users', uid)
    await setDoc(
      userRef,
      {
        consent,
        updatedAt: Date.now(),
      },
      { merge: true }
    )
    return consent
  },

  async redeemInvite(code) {
    const functions = getFunctionsInstance()
    const fn = httpsCallable(functions, 'redeemInvite')
    const response = await fn({ code })
    return response.data
  },

  async checkInvite(code) {
    const functions = getFunctionsInstance()
    const fn = httpsCallable(functions, 'checkInvite')
    const response = await fn({ code })
    return response.data
  },

  async createTelegramLinkToken() {
    const functions = getFunctionsInstance()
    const fn = httpsCallable(functions, 'createTelegramLinkToken')
    const response = await fn({})
    return response.data
  },
})
