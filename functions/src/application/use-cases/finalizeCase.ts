import { CaseDraft, Evidence } from '../../domain/types.js'
import { CaseRepositoryPort } from '../../infrastructure/ports/CaseRepositoryPort.js'

export interface FinalizeCaseInput {
  caseRepository: CaseRepositoryPort
  caseId: string
  draft: CaseDraft
  evidences: Evidence[]
  finalStatus?: 'review' | 'ready'
}

export const finalizeCase = async ({
  caseRepository,
  caseId,
  draft,
  evidences,
  finalStatus = 'review',
}: FinalizeCaseInput): Promise<void> => {
  await caseRepository.saveDraft(caseId, draft, evidences, finalStatus)
}
