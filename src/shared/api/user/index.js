import { firestoreUserRepository } from './firestoreUserRepository.js'
import { mockUserRepository } from './mockUserRepository.js'
import { assertNoMocksInProduction } from '../guard.js'

export { USER_STORAGE_KEYS } from './types.ts'
export { firestoreUserRepository } from './firestoreUserRepository.js'
export { mockUserRepository } from './mockUserRepository.js'
export { exportUserData } from './exportUserData.js'

export const getUserRepository = () => {
  assertNoMocksInProduction()
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseProjectId) {
    return mockUserRepository
  }

  return firestoreUserRepository
}
