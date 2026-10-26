import { z } from 'zod'
import {
  caseBrandingSchema,
  caseCardVariantSchema,
  caseDraftMetricSchema,
  caseDraftQuoteSchema,
  caseDraftSchema,
  caseSchema,
  caseStatusSchema,
  chatExtractionSchema,
  chatMessageSchema,
  chatMessageSideSchema,
  evidenceKindSchema,
  evidenceSchema,
  pipelineStageSchema,
  sourceKindSchema,
  sourceSchema,
  transcriptSchema,
  transcriptSegmentSchema,
  verificationReportSchema,
} from './schemas.js'

export type CaseStatus = z.infer<typeof caseStatusSchema>
export type PipelineStage = z.infer<typeof pipelineStageSchema>
export type SourceKind = z.infer<typeof sourceKindSchema>
export type Source = z.infer<typeof sourceSchema>
export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>
export type Transcript = z.infer<typeof transcriptSchema>
export type ChatMessageSide = z.infer<typeof chatMessageSideSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>
export type ChatExtraction = z.infer<typeof chatExtractionSchema>
export type EvidenceKind = z.infer<typeof evidenceKindSchema>
export type Evidence = z.infer<typeof evidenceSchema>
export type CaseDraftMetric = z.infer<typeof caseDraftMetricSchema>
export type CaseDraftQuote = z.infer<typeof caseDraftQuoteSchema>
export type CaseDraft = z.infer<typeof caseDraftSchema>
export type CaseCardVariantType = z.infer<typeof caseCardVariantSchema>
export type CaseBranding = z.infer<typeof caseBrandingSchema>
export type Case = z.infer<typeof caseSchema>
export type VerificationReport = z.infer<typeof verificationReportSchema>
