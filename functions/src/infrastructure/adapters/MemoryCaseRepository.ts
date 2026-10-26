import { Case, CaseDraft, Evidence, PipelineStage } from '../../domain/types.js'
import { CaseRepositoryPort } from '../ports/CaseRepositoryPort.js'

export class MemoryCaseRepository implements CaseRepositoryPort {
  private cases: Map<string, Case> = new Map()
  private onStageChange?: (
    caseId: string,
    stage: PipelineStage,
    percent: number,
    message?: string
  ) => void

  constructor(
    initialCases: Case[] | Map<string, Case> = [],
    onStageChange?: (
      caseId: string,
      stage: PipelineStage,
      percent: number,
      message?: string
    ) => void
  ) {
    if (initialCases instanceof Map) {
      initialCases.forEach((c, id) => this.cases.set(id, { ...c }))
    } else {
      initialCases.forEach((c) => this.cases.set(c.id, { ...c }))
    }
    this.onStageChange = onStageChange
  }

  async getCase(caseId: string): Promise<Case | null> {
    const item = this.cases.get(caseId)
    return item ? { ...item } : null
  }

  async updateStage(
    caseId: string,
    stage: PipelineStage,
    percent: number,
    message?: string
  ): Promise<void> {
    const item = this.cases.get(caseId)
    if (!item) return
    item.stage = stage
    item.stageProgress = percent
    item.stageMessage = message
    item.updatedAt = Date.now()
    this.cases.set(caseId, item)
    this.onStageChange?.(caseId, stage, percent, message)
  }

  async failCase(
    caseId: string,
    stage: PipelineStage,
    error: string
  ): Promise<void> {
    const item = this.cases.get(caseId)
    if (!item) return
    item.status = 'failed'
    item.stage = stage
    item.failReason = error
    item.updatedAt = Date.now()
    this.cases.set(caseId, item)
  }

  async saveDraft(
    caseId: string,
    draft: CaseDraft,
    evidences: Evidence[],
    finalStatus: 'review' | 'ready' = 'review'
  ): Promise<void> {
    const item = this.cases.get(caseId)
    if (!item) return
    item.draft = draft
    item.status = finalStatus
    item.stage = 'done'
    item.stageProgress = 100
    item.updatedAt = Date.now()
    this.cases.set(caseId, item)
  }

  setCase(caseItem: Case): void {
    this.cases.set(caseItem.id, { ...caseItem })
  }
}
