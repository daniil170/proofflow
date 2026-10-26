import { config } from '../config.js'
import type { BetaApplicationRepository } from './BetaApplicationRepository.js'
import { FirestoreBetaApplicationRepository } from './FirestoreBetaApplicationRepository.js'
import { InMemoryBetaApplicationRepository } from './InMemoryBetaApplicationRepository.js'

export * from './BetaApplicationRepository.js'
export * from './FirestoreBetaApplicationRepository.js'
export * from './InMemoryBetaApplicationRepository.js'

let singletonRepository: BetaApplicationRepository | null = null

export const getRepository = (storageType = config.storageType): BetaApplicationRepository => {
  if (singletonRepository) return singletonRepository

  if (storageType === 'firestore') {
    singletonRepository = new FirestoreBetaApplicationRepository()
  } else {
    singletonRepository = new InMemoryBetaApplicationRepository()
  }

  return singletonRepository
}

export const setRepository = (repo: BetaApplicationRepository | null): void => {
  singletonRepository = repo
}
