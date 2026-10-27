import { firestoreAnalyticsGateway } from './firestoreAnalyticsGateway.js'
import { mockAnalyticsGateway } from './mockAnalyticsGateway.js'
import { assertNoMocksInProduction } from '../guard.js'

export * from './types.ts'
export { firestoreAnalyticsGateway } from './firestoreAnalyticsGateway.js'
export { mockAnalyticsGateway } from './mockAnalyticsGateway.js'

export const getAnalyticsGateway = () => {
  assertNoMocksInProduction()
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
