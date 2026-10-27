import { USER_STORAGE_KEYS } from './types.ts'

const listeners = new Set()

const getPersistedUserDoc = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEYS.MOCK_USER_DOC)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

let activeUserDoc = getPersistedUserDoc()

const notifyListeners = () => {
  listeners.forEach((cb) => cb(activeUserDoc))
}

const persistUserDoc = (doc) => {
  activeUserDoc = doc
  if (typeof window !== 'undefined' && window.localStorage) {
    if (doc) {
      window.localStorage.setItem(
        USER_STORAGE_KEYS.MOCK_USER_DOC,
        JSON.stringify(doc)
      )
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEYS.MOCK_USER_DOC)
    }
  }
  notifyListeners()
}

export const mockUserRepository = Object.freeze({
  async getUser(uid) {
    if (!uid) return null
    if (!activeUserDoc || activeUserDoc.id !== uid) {
      activeUserDoc = {
        id: uid,
        email: 'mock@example.com',
        accessStatus: 'waitlist',
        workspaceId: uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      persistUserDoc(activeUserDoc)
    }
    return activeUserDoc
  },

  subscribeToUser(uid, callback) {
    if (!uid) {
      callback(null)
      return () => {}
    }
    listeners.add(callback)
    if (!activeUserDoc || activeUserDoc.id !== uid) {
      activeUserDoc = {
        id: uid,
        email: 'mock@example.com',
        accessStatus: 'waitlist',
        workspaceId: uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      persistUserDoc(activeUserDoc)
    }
    queueMicrotask(() => {
      callback(activeUserDoc)
    })
    return () => {
      listeners.delete(callback)
    }
  },

  async updateProfile(uid, profile) {
    const current = activeUserDoc || {
      id: uid,
      email: 'mock@example.com',
      accessStatus: 'active',
      workspaceId: uid,
    }
    const updated = {
      ...current,
      profile: {
        ...current.profile,
        ...profile,
      },
      updatedAt: Date.now(),
    }
    persistUserDoc(updated)
    return profile
  },

  async acceptConsent(uid, consent) {
    const current = activeUserDoc || {
      id: uid,
      email: 'mock@example.com',
      accessStatus: 'active',
      workspaceId: uid,
    }
    const updated = {
      ...current,
      consent,
      updatedAt: Date.now(),
    }
    persistUserDoc(updated)
    return consent
  },

  async redeemInvite(code) {
    const normalized = (code || '').trim().toUpperCase()
    if (!normalized || normalized === 'NOT_FOUND') {
      const err = new Error('Приглашение не найдено')
      err.code = 'not-found'
      throw err
    }
    if (normalized === 'EXPIRED') {
      const err = new Error('Срок действия приглашения истёк')
      err.code = 'failed-precondition'
      throw err
    }
    if (normalized === 'USED') {
      const err = new Error('Приглашение уже использовано')
      err.code = 'failed-precondition'
      throw err
    }
    if (normalized === 'REVOKED') {
      const err = new Error('Приглашение отозвано')
      err.code = 'failed-precondition'
      throw err
    }

    const current = activeUserDoc || {
      id: 'mock-user-1',
      email: 'mock@example.com',
      workspaceId: 'mock-user-1',
    }
    const updated = {
      ...current,
      accessStatus: 'active',
      updatedAt: Date.now(),
    }
    persistUserDoc(updated)
    return {
      success: true,
      accessStatus: 'active',
    }
  },

  async checkInvite(code) {
    const normalized = (code || '').trim().toUpperCase()
    if (!normalized || normalized === 'NOT_FOUND') {
      return {
        valid: false,
        status: 'not_found',
        message: 'Приглашение не найдено',
      }
    }
    if (normalized === 'EXPIRED') {
      return {
        valid: false,
        status: 'expired',
        message: 'Срок действия приглашения истёк',
      }
    }
    if (normalized === 'USED') {
      return {
        valid: false,
        status: 'used',
        message: 'Приглашение уже использовано',
      }
    }
    if (normalized === 'REVOKED') {
      return {
        valid: false,
        status: 'revoked',
        message: 'Приглашение отозвано',
      }
    }
    return {
      valid: true,
      status: 'issued',
      expiresAt: Date.now() + 86400000,
      channel: 'web',
    }
  },

  async createTelegramLinkToken() {
    return {
      token: 'mock-tg-token-' + Math.random().toString(36).substring(2, 10),
      botUsername: 'proofflowbot',
      expiresAt: Date.now() + 900000,
    }
  },

  async deleteAccount() {
    persistUserDoc(null)
    return { success: true }
  },

  _reset(initialDoc = null) {
    persistUserDoc(initialDoc)
  },
})
