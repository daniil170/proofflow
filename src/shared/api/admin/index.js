import {
  firestoreAdminInviteRepository,
  firestoreAdminUsersRepository,
  firestoreAnalyticsRepository,
  firestoreApplicationRepository,
} from './firestoreAdminRepository.js'
import {
  mockAdminInviteRepository,
  mockAdminUsersRepository,
  mockAnalyticsRepository,
  mockApplicationRepository,
} from './mockAdminRepository.js'
import { assertNoMocksInProduction } from '../guard.js'

export { ADMIN_STORAGE_KEYS } from './types.ts'

export const getApplicationRepository = () => {
  assertNoMocksInProduction()
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseProjectId) {
    return mockApplicationRepository
  }

  return firestoreApplicationRepository
}

export const getAdminInviteRepository = () => {
  assertNoMocksInProduction()
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseProjectId) {
    return mockAdminInviteRepository
  }

  return firestoreAdminInviteRepository
}

export const getAdminUsersRepository = () => {
  assertNoMocksInProduction()
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseProjectId) {
    return mockAdminUsersRepository
  }

  return firestoreAdminUsersRepository
}

export const getAnalyticsRepository = () => {
  assertNoMocksInProduction()
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseProjectId) {
    return mockAnalyticsRepository
  }

  return firestoreAnalyticsRepository
}
