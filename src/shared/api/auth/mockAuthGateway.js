import { AUTH_STORAGE_KEYS } from './types.js'

const listeners = new Set()

const getPersistedUser = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEYS.MOCK_USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

let activeUser = getPersistedUser()

const notifyListeners = () => {
  listeners.forEach((callback) => {
    callback(activeUser)
  })
}

const persistUser = (user) => {
  activeUser = user
  if (typeof window !== 'undefined' && window.localStorage) {
    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEYS.MOCK_USER, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.MOCK_USER)
    }
  }
  notifyListeners()
}

export const mockAuthGateway = Object.freeze({
  subscribeToAuthState(callback) {
    listeners.add(callback)
    queueMicrotask(() => {
      callback(activeUser)
    })
    return () => {
      listeners.delete(callback)
    }
  },

  async sendEmailLink(email) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(AUTH_STORAGE_KEYS.EMAIL_FOR_SIGN_IN, email)
    }
    return { success: true }
  },

  isEmailLink(href) {
    const target = href || (typeof window !== 'undefined' ? window.location.href : '')
    return target.includes('mockSignIn=true') || target.includes('apiKey=')
  },

  async signInWithEmailLink(email) {
    let targetEmail = email
    if (!targetEmail && typeof window !== 'undefined' && window.localStorage) {
      targetEmail = window.localStorage.getItem(AUTH_STORAGE_KEYS.EMAIL_FOR_SIGN_IN) || ''
    }

    if (!targetEmail) {
      targetEmail = 'demo@proofflow.ai'
    }

    const cleanEmail = targetEmail.trim().toLowerCase()
    const safeId = 'user_' + cleanEmail.replace(/[^a-z0-9]/g, '_')

    const user = {
      id: safeId,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      photoURL: null,
    }

    persistUser(user)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.EMAIL_FOR_SIGN_IN)
    }
    return user
  },

  async signInWithGoogle() {
    const user = {
      id: 'mock-user-google',
      email: 'alex.founder@proofflow.ai',
      displayName: 'Алексей Основатель',
      photoURL: null,
    }

    persistUser(user)
    return user
  },

  async signOut() {
    persistUser(null)
  },

  async syncAdminClaims(email) {
    const targetEmail = email || getPersistedUser()?.email || ''
    if (!targetEmail) return false
    const adminEmails = (
      import.meta.env.VITE_ADMIN_EMAILS ||
      'admin@proofflow.ru,owner@proofflow.ru,mock@example.com'
    )
      .split(',')
      .map((e) => e.trim().toLowerCase())
    return (
      adminEmails.includes(targetEmail.trim().toLowerCase()) ||
      targetEmail === 'admin@proofflow.ru' ||
      targetEmail === 'mock@example.com'
    )
  },

  getStoredEmailForSignIn() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(AUTH_STORAGE_KEYS.EMAIL_FOR_SIGN_IN) || ''
    }
    return ''
  },
})
