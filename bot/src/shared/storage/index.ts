import { config } from '../config.js'
import type { BetaApplicationRepository } from './BetaApplicationRepository.js'
import { FirestoreBetaApplicationRepository } from './FirestoreBetaApplicationRepository.js'
import { InMemoryBetaApplicationRepository } from './InMemoryBetaApplicationRepository.js'

import type { SupportTicketRepository } from './SupportTicketRepository.js'
import { FirestoreSupportTicketRepository } from './FirestoreSupportTicketRepository.js'
import { InMemorySupportTicketRepository } from './InMemorySupportTicketRepository.js'

import type { IdeaRepository } from './IdeaRepository.js'
import { FirestoreIdeaRepository } from './FirestoreIdeaRepository.js'
import { InMemoryIdeaRepository } from './InMemoryIdeaRepository.js'

import type { IdeaVoteRepository } from './IdeaVoteRepository.js'
import { FirestoreIdeaVoteRepository } from './FirestoreIdeaVoteRepository.js'
import { InMemoryIdeaVoteRepository } from './InMemoryIdeaVoteRepository.js'

export * from './BetaApplicationRepository.js'
export * from './FirestoreBetaApplicationRepository.js'
export * from './InMemoryBetaApplicationRepository.js'

export * from './SupportTicketRepository.js'
export * from './FirestoreSupportTicketRepository.js'
export * from './InMemorySupportTicketRepository.js'

export * from './IdeaRepository.js'
export * from './FirestoreIdeaRepository.js'
export * from './InMemoryIdeaRepository.js'

export * from './IdeaVoteRepository.js'
export * from './FirestoreIdeaVoteRepository.js'
export * from './InMemoryIdeaVoteRepository.js'
export * from './FirestoreSessionStorage.js'

let singletonRepository: BetaApplicationRepository | null = null
let singletonTicketRepository: SupportTicketRepository | null = null
let singletonIdeaRepository: IdeaRepository | null = null
let singletonVoteRepository: IdeaVoteRepository | null = null

export const getRepository = (
  storageType = config.storageType
): BetaApplicationRepository => {
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

export const getSupportTicketRepository = (
  storageType = config.storageType
): SupportTicketRepository => {
  if (singletonTicketRepository) return singletonTicketRepository

  if (storageType === 'firestore') {
    singletonTicketRepository = new FirestoreSupportTicketRepository()
  } else {
    singletonTicketRepository = new InMemorySupportTicketRepository()
  }

  return singletonTicketRepository
}

export const setSupportTicketRepository = (
  repo: SupportTicketRepository | null
): void => {
  singletonTicketRepository = repo
}

export const getIdeaRepository = (
  storageType = config.storageType
): IdeaRepository => {
  if (singletonIdeaRepository) return singletonIdeaRepository

  if (storageType === 'firestore') {
    singletonIdeaRepository = new FirestoreIdeaRepository()
  } else {
    singletonIdeaRepository = new InMemoryIdeaRepository()
  }

  return singletonIdeaRepository
}

export const setIdeaRepository = (repo: IdeaRepository | null): void => {
  singletonIdeaRepository = repo
}

export const getIdeaVoteRepository = (
  storageType = config.storageType
): IdeaVoteRepository => {
  if (singletonVoteRepository) return singletonVoteRepository

  if (storageType === 'firestore') {
    singletonVoteRepository = new FirestoreIdeaVoteRepository()
  } else {
    singletonVoteRepository = new InMemoryIdeaVoteRepository()
  }

  return singletonVoteRepository
}

export const setIdeaVoteRepository = (
  repo: IdeaVoteRepository | null
): void => {
  singletonVoteRepository = repo
}
