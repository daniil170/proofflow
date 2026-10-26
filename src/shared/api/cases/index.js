import { firestoreCaseRepository } from './firestoreCaseRepository.js'
import { mockCaseRepository } from './mockCaseRepository.js'

export {
  CASE_STATUS,
  CASE_STATUS_LABELS,
  CASE_STORAGE_KEY,
  INITIAL_EXAMPLE_CASES,
} from './types.js'
export { firestoreCaseRepository } from './firestoreCaseRepository.js'
export { mockCaseRepository } from './mockCaseRepository.js'

export const getCaseRepository = () => {
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseProjectId) {
    return mockCaseRepository
  }

  return firestoreCaseRepository
}
