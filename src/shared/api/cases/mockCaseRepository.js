import { CASE_STORAGE_KEY, INITIAL_EXAMPLE_CASES } from './types.js'

const listeners = new Set()

const loadCases = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }
  try {
    const raw = window.localStorage.getItem(CASE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveCases = (cases) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(cases))
  }
}

let casesStore = loadCases()

const notifyListeners = () => {
  listeners.forEach((record) => {
    if (record.caseId) {
      const found = casesStore.find((item) => item.id === record.caseId)
      record.onUpdate(found ? { ...found } : null)
    } else if (record.onUpdate) {
      const filtered = record.ownerId ? casesStore.filter((item) => item.ownerId === record.ownerId) : casesStore
      const sorted = [...filtered].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      record.onUpdate(sorted)
    }
  })
}

export const mockCaseRepository = Object.freeze({
  subscribeByOwner(ownerId, onUpdate) {
    const listenerRecord = { ownerId, onUpdate }
    listeners.add(listenerRecord)

    queueMicrotask(() => {
      const filtered = ownerId ? casesStore.filter((item) => item.ownerId === ownerId) : casesStore
      const sorted = [...filtered].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      onUpdate(sorted)
    })

    return () => {
      listeners.delete(listenerRecord)
    }
  },

  subscribeById(id, onUpdate) {
    const listenerRecord = { caseId: id, onUpdate }
    listeners.add(listenerRecord)

    queueMicrotask(() => {
      const found = casesStore.find((item) => item.id === id)
      onUpdate(found ? { ...found } : null)
    })

    return () => {
      listeners.delete(listenerRecord)
    }
  },

  async getById(id) {
    const found = casesStore.find((item) => item.id === id)
    return found ? { ...found } : null
  },

  async create(caseData) {
    const timestamp = Date.now()
    const newCase = {
      id: `mock-case-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...caseData,
    }
    casesStore = [newCase, ...casesStore]
    saveCases(casesStore)
    notifyListeners()
    return newCase
  },

  async update(id, partialData) {
    let updatedItem = null
    casesStore = casesStore.map((item) => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          ...partialData,
          updatedAt: Date.now(),
        }
        return updatedItem
      }
      return item
    })
    saveCases(casesStore)
    notifyListeners()
    return updatedItem
  },

  async seedExamples(ownerId) {
    const timestamp = Date.now()
    const newExamples = INITIAL_EXAMPLE_CASES.map((example, index) => ({
      id: `mock-example-${timestamp}-${index}`,
      ...example,
      ownerId,
      createdAt: timestamp - index * 60000,
      updatedAt: timestamp - index * 60000,
    }))

    casesStore = [...newExamples, ...casesStore]
    saveCases(casesStore)
    notifyListeners()
    return newExamples
  },

  async saveFeedback({ caseId, rating, comment, userId }) {
    const payload = {
      id: `mock-feedback-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      caseId,
      rating,
      comment: comment || '',
      userId: userId || null,
      createdAt: Date.now(),
    }
    return payload
  },
})
