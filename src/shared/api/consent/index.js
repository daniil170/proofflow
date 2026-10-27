import { firebaseConsentGateway } from './firebaseConsentGateway.js'
import { mockConsentGateway } from './mockConsentGateway.js'
import { assertNoMocksInProduction } from '../guard.js'

export const getConsentGateway = () => {
  assertNoMocksInProduction()
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseProjectId) {
    return mockConsentGateway
  }

  return firebaseConsentGateway
}
