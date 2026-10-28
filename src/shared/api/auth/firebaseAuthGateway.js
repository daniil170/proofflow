import {
  getAuth,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirebaseApp } from '../firebase/app.js'
import { AUTH_STORAGE_KEYS } from './types.js'

const getAuthInstance = () => getAuth(getFirebaseApp())
const getFunctionsInstance = () => getFunctions(getFirebaseApp())

const mapFirebaseUser = (user) => {
  if (!user) {
    return null
  }
  return {
    id: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? (user.email ? user.email.split('@')[0] : 'Пользователь'),
    photoURL: user.photoURL ?? null,
  }
}

export const firebaseAuthGateway = Object.freeze({
  subscribeToAuthState(callback) {
    const auth = getAuthInstance()
    return onAuthStateChanged(auth, (user) => {
      callback(mapFirebaseUser(user))
    })
  },

  async sendEmailLink(email, continueUrl) {
    const auth = getAuthInstance()
    const targetUrl = continueUrl || window.location.href
    const actionCodeSettings = {
      url: targetUrl,
      handleCodeInApp: true,
    }

    await sendSignInLinkToEmail(auth, email, actionCodeSettings)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(AUTH_STORAGE_KEYS.EMAIL_FOR_SIGN_IN, email)
    }
    return { success: true }
  },

  isEmailLink(href) {
    const auth = getAuthInstance()
    return isSignInWithEmailLink(auth, href || window.location.href)
  },

  async signInWithEmailLink(email, href) {
    const auth = getAuthInstance()
    const url = href || window.location.href
    let targetEmail = email

    if (!targetEmail && typeof window !== 'undefined' && window.localStorage) {
      targetEmail = window.localStorage.getItem(AUTH_STORAGE_KEYS.EMAIL_FOR_SIGN_IN) || ''
    }

    if (!targetEmail) {
      throw new Error('MISSING_EMAIL_FOR_SIGN_IN')
    }

    const result = await signInWithEmailLink(auth, targetEmail, url)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.EMAIL_FOR_SIGN_IN)
    }
    return mapFirebaseUser(result.user)
  },

  async signInWithGoogle() {
    const auth = getAuthInstance()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const result = await signInWithPopup(auth, provider)
    return mapFirebaseUser(result.user)
  },

  async syncAdminClaims() {
    const functions = getFunctionsInstance()
    const syncFn = httpsCallable(functions, 'syncAdminClaims')
    const res = await syncFn()
    const auth = getAuthInstance()
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true)
    }
    return Boolean(res.data?.isAdmin)
  },

  async signOut() {
    const auth = getAuthInstance()
    await signOut(auth)
  },

  getStoredEmailForSignIn() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(AUTH_STORAGE_KEYS.EMAIL_FOR_SIGN_IN) || ''
    }
    return ''
  },
})
