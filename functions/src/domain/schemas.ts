import { z } from 'zod'

export const DEFAULT_ANONYMIZED_AUTHOR_LABEL = 'Анна К.'

export const caseStatusSchema = z.enum([
  'draft',
  'uploading',
  'processing',
  'review',
  'ready',
  'published',
  'failed',
])

export const pipelineStageSchema = z.enum([
  'preparing',
  'transcribing',
  'reading',
  'analyzing',
  'verifying',
  'done',
  'failed',
])

export const sourceKindSchema = z.enum([
  'screenshot',
  'audio',
  'video',
  'voice',
])

export const sourceSchema = z.object({
  id: z.string().min(1),
  kind: sourceKindSchema,
  storagePath: z.string().min(1),
  durationSec: z.number().nonnegative().nullable().optional(),
  mimeType: z.string().min(1),
  order: z.number().int().nonnegative(),
})

export const transcriptSegmentSchema = z.object({
  id: z.string().optional(),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  text: z.string().min(1),
})

export const transcriptSchema = z.object({
  sourceId: z.string().optional(),
  segments: z.array(transcriptSegmentSchema),
})

export const chatMessageSideSchema = z.enum(['client', 'me'])

export const chatMessageSchema = z.object({
  id: z.string().optional(),
  side: chatMessageSideSchema,
  text: z.string().min(1),
  time: z.string().min(1),
  order: z.number().int().nonnegative(),
})

export const chatExtractionSchema = z.object({
  screenshotSourceId: z.string().min(1),
  messages: z.array(chatMessageSchema),
  order: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1),
})

export const evidenceKindSchema = z.enum([
  'transcriptSegment',
  'chatMessage',
])

export const evidenceSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  kind: evidenceKindSchema,
  reference: z.string().min(1),
  exactQuote: z.string().min(1),
})

export const caseDraftMetricSchema = z.object({
  value: z.string(),
  label: z.string(),
  evidenceId: z.string().nullable().optional(),
})

export const caseDraftQuoteSchema = z.object({
  text: z.string(),
  authorLabel: z.string().default(DEFAULT_ANONYMIZED_AUTHOR_LABEL),
  evidenceId: z.string().nullable().optional(),
  authorRole: z.string().optional(),
  authorCompany: z.string().optional(),
})

export const caseDraftSchema = z.object({
  metric: caseDraftMetricSchema,
  problem: z.string(),
  solution: z.string(),
  result: z.string(),
  quote: caseDraftQuoteSchema,
  tags: z.array(z.string()).default([]),
  missingFields: z.array(z.string()).default([]),
  needsReview: z.array(z.string()).default([]),
})

export const caseCardVariantSchema = z.enum([
  'dark',
  'newspaper',
  'whatsapp',
  'receipt',
  'minimal',
])

export const caseBrandingSchema = z.object({
  showLogo: z.boolean().default(true),
  primaryColor: z.string().nullable().optional(),
  accentColor: z.string().nullable().optional(),
  badgeText: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  logoPath: z.string().nullable().optional(),
})

export const caseSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  status: caseStatusSchema,
  stage: pipelineStageSchema.optional(),
  stageProgress: z.number().min(0).max(100).optional(),
  stageMessage: z.string().optional(),
  clientLabel: z.string().min(1),
  consentConfirmed: z.boolean(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  sources: z.array(sourceSchema).default([]),
  draft: caseDraftSchema.nullable().optional(),
  selectedVariant: caseCardVariantSchema.default('dark'),
  branding: caseBrandingSchema.default({ showLogo: true }),
  publishedAt: z.number().int().nonnegative().nullable().optional(),
  failReason: z.string().optional(),
})

export const verificationReportSchema = z.object({
  isQuoteVerified: z.boolean(),
  isMetricVerified: z.boolean(),
  missingFields: z.array(z.string()),
  needsReview: z.array(z.string()),
  unverifiedQuotes: z.array(z.string()),
  unverifiedMetrics: z.array(z.string()),
  evidences: z.array(evidenceSchema),
})
