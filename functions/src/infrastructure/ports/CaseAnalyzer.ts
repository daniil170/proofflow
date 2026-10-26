import { CaseDraft, ChatExtraction, Transcript } from '../../domain/types.js'

export interface AnalysisInput {
  clientLabel?: string
  language?: string
  transcripts: Transcript[]
  chatExtractions: ChatExtraction[]
}

export interface CaseAnalyzer {
  analyze(input: AnalysisInput): Promise<CaseDraft>
}
