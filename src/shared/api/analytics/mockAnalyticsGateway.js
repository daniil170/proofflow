import { sanitizeMetadata } from './firestoreAnalyticsGateway.js'

const STORAGE_KEY = 'proofflow_dev_events'

const getStoredEvents = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveStoredEvents = (events) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {
    void 0
  }
}

export const createMockAnalyticsGateway = () => {
  let memoryEvents = getStoredEvents()

  return {
    async trackEvent({ eventName, userId = null, caseId = null, metadata = {} }) {
      if (!eventName) return

      const payload = {
        eventName,
        userId: userId || 'mock-user-1',
        caseId: caseId || null,
        timestamp: Date.now(),
        metadata: sanitizeMetadata(metadata),
      }

      memoryEvents.push(payload)
      saveStoredEvents(memoryEvents)
    },

    async getEvents() {
      if (memoryEvents.length === 0) {
        memoryEvents = getStoredEvents()
      }
      return [...memoryEvents]
    },

    clearEvents() {
      memoryEvents = []
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    },
  }
}

export const mockAnalyticsGateway = createMockAnalyticsGateway()
