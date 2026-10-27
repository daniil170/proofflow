import {
  firestoreAdminInviteRepository,
  firestoreAnalyticsRepository,
  firestoreApplicationRepository,
} from './firestoreAdminRepository.js'
import {
  mockAdminInviteRepository,
  mockAnalyticsRepository,
  mockApplicationRepository,
} from './mockAdminRepository.js'

export { ADMIN_STORAGE_KEYS } from './types.ts'

export const getApplicationRepository = () => {
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseProjectId) {
    return mockApplicationRepository
  }

  return firestoreApplicationRepository
}

export const getAdminInviteRepository = () => {
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseProjectId) {
    return mockAdminInviteRepository
  }

  return firestoreAdminInviteRepository
}

export const getAnalyticsRepository = () => {
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseProjectId) {
    return mockAnalyticsRepository
  }

  return firestoreAnalyticsRepository
}
