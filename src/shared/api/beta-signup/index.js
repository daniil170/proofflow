import { firebaseBetaSignupGateway } from './firebaseGateway.js'
import { mockBetaSignupGateway } from './mockGateway.js'
import { assertNoMocksInProduction } from '../guard.js'

export { SIGNUP_STATUS } from './types.js'
export { mockBetaSignupGateway } from './mockGateway.js'
export { firebaseBetaSignupGateway } from './firebaseGateway.js'

export const getBetaSignupGateway = () => {
  assertNoMocksInProduction()
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseProjectId) {
    return mockBetaSignupGateway
  }

  return firebaseBetaSignupGateway
}
