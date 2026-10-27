import { firestoreAnalyticsGateway } from './firestoreAnalyticsGateway.js'
import { mockAnalyticsGateway } from './mockAnalyticsGateway.js'

export * from './types.ts'
export { firestoreAnalyticsGateway } from './firestoreAnalyticsGateway.js'
export { mockAnalyticsGateway } from './mockAnalyticsGateway.js'

export const getAnalyticsGateway = () => {
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseProjectId) {
    return mockAnalyticsGateway
  }

  return firestoreAnalyticsGateway
}

export const trackAnalyticsEvent = async (eventName, options = {}) => {
  try {
    const gateway = getAnalyticsGateway()
    await gateway.trackEvent({
      eventName,
      ...options,
    })
  } catch {
    void 0
  }
}
