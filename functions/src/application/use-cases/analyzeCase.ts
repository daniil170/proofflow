import { CaseDraft, ChatExtraction, Transcript } from '../../domain/types.js'
import { CaseAnalyzer } from '../../infrastructure/ports/CaseAnalyzer.js'

export interface AnalyzeCaseInput {
  analyzer: CaseAnalyzer
  clientLabel?: string
  language?: string
  transcripts: Transcript[]
  chatExtractions: ChatExtraction[]
}

export const analyzeCase = async ({
  analyzer,
  clientLabel,
  language,
  transcripts,
  chatExtractions,
}: AnalyzeCaseInput): Promise<CaseDraft> => {
  return analyzer.analyze({
    clientLabel,
    language,
    transcripts,
    chatExtractions,
  })
}
