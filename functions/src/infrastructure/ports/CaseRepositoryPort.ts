import {
  Case,
  CaseDraft,
  Evidence,
  MessengerType,
  PersistedChatMessage,
  PipelineStage,
} from '../../domain/types.js'

export interface SaveDraftOptions {
  chatMessages?: PersistedChatMessage[]
  selectedChatMessages?: PersistedChatMessage[]
  messenger?: MessengerType
}

export interface CaseRepositoryPort {
  getCase(caseId: string): Promise<Case | null>
  updateStage(
    caseId: string,
    stage: PipelineStage,
    percent: number,
    message?: string
  ): Promise<void>
  failCase(caseId: string, stage: PipelineStage, error: string): Promise<void>
  saveDraft(
    caseId: string,
    draft: CaseDraft,
    evidences: Evidence[],
    finalStatus?: 'review' | 'ready',
    options?: SaveDraftOptions
  ): Promise<void>
  countCasesByOwner?(ownerId: string): Promise<number>
}
