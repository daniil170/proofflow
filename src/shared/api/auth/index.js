import { firebaseAuthGateway } from './firebaseAuthGateway.js'
import { mockAuthGateway } from './mockAuthGateway.js'

export { AUTH_STORAGE_KEYS } from './types.js'
export { firebaseAuthGateway } from './firebaseAuthGateway.js'
export { mockAuthGateway } from './mockAuthGateway.js'

export const getAuthGateway = () => {
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseApiKey = Boolean(import.meta.env.VITE_FIREBASE_API_KEY)
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseApiKey || !hasFirebaseProjectId) {
    return mockAuthGateway
  }

  return firebaseAuthGateway
}
