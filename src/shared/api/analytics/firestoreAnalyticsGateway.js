import { addDoc, collection, getFirestore } from 'firebase/firestore'
import { getFirebaseApp } from '../firebase/app.js'

const getDbInstance = () => getFirestore(getFirebaseApp())

const PII_KEYS = new Set([
  'email',
  'mail',
  'phone',
  'phonenumber',
  'telephone',
  'name',
  'fullname',
  'displayname',
  'firstname',
  'lastname',
  'ip',
  'ipaddress',
  'token',
  'accesstoken',
  'idtoken',
  'password',
])

export const sanitizeMetadata = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }
  const clean = {}
  for (const [key, value] of Object.entries(raw)) {
    if (PII_KEYS.has(key.toLowerCase())) {
      continue
    }
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      clean[key] = value
    }
  }
  return clean
}

export const createFirestoreAnalyticsGateway = () => ({
  async trackEvent({ eventName, userId = null, caseId = null, metadata = {} }) {
    if (!eventName) return

    try {
      const db = getDbInstance()
      const eventsCol = collection(db, 'events')
      const sanitizedMeta = sanitizeMetadata(metadata)

      const payload = {
        eventName,
        userId: userId || 'anonymous',
        caseId: caseId || null,
        timestamp: Date.now(),
        metadata: sanitizedMeta,
      }

      await addDoc(eventsCol, payload)
    } catch {
      void 0
    }
  },
})

export const firestoreAnalyticsGateway = createFirestoreAnalyticsGateway()
