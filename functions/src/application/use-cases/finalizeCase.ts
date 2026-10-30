import {
  CaseDraft,
  Evidence,
  MessengerType,
  PersistedChatMessage,
} from '../../domain/types.js'
import { CaseRepositoryPort } from '../../infrastructure/ports/CaseRepositoryPort.js'

export interface FinalizeCaseInput {
  caseRepository: CaseRepositoryPort
  caseId: string
  draft: CaseDraft
  evidences: Evidence[]
  chatMessages?: PersistedChatMessage[]
  selectedChatMessages?: PersistedChatMessage[]
  messenger?: MessengerType
  finalStatus?: 'review' | 'ready'
}

export const finalizeCase = async ({
  caseRepository,
  caseId,
  draft,
  evidences,
  chatMessages = [],
  selectedChatMessages = [],
  messenger = 'unknown',
  finalStatus = 'review',
}: FinalizeCaseInput): Promise<void> => {
  await caseRepository.saveDraft(caseId, draft, evidences, finalStatus, {
    chatMessages,
    selectedChatMessages,
    messenger,
  })
}
