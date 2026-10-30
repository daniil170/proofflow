import { z } from 'zod'

export const DEFAULT_ANONYMIZED_AUTHOR_LABEL = 'Клиент'

export const caseStatusSchema = z.enum([
  'draft',
  'uploading',
  'processing',
  'review',
  'ready',
  'published',
  'failed',
])

export const sourceKindSchema = z.enum(['screenshot', 'audio', 'video', 'voice'])

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

export const messengerSchema = z.enum(['telegram', 'whatsapp', 'unknown'])

export const chatMessageSchema = z.object({
  id: z.string().optional(),
  side: chatMessageSideSchema,
  text: z.string().min(1),
  time: z.string().min(1),
  order: z.number().int().nonnegative(),
})

export const persistedChatMessageSchema = z.object({
  id: z.string().optional(),
  side: chatMessageSideSchema,
  text: z.string().min(1),
  time: z.string().optional(),
  sourceId: z.string().optional(),
  order: z.number().int().nonnegative(),
})

export const chatExtractionSchema = z.object({
  screenshotSourceId: z.string().min(1),
  messenger: messengerSchema.default('unknown'),
  messages: z.array(chatMessageSchema),
  order: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1),
})

export const evidenceKindSchema = z.enum(['transcriptSegment', 'chatMessage'])

export const evidenceSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  kind: evidenceKindSchema,
  reference: z.string().min(1),
  exactQuote: z.string().min(1),
})

export const caseDraftHeadlineSchema = z.object({
  text: z.string().default(''),
  evidenceId: z.string().nullable().optional(),
})

export const summaryRowOriginSchema = z.enum([
  'client_words',
  'ai_paraphrase',
  'user_written',
])

export const summaryRowSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  text: z.string().min(1),
  evidenceId: z.string().nullable().optional(),
  origin: summaryRowOriginSchema.default('ai_paraphrase'),
})

export const caseDraftMetricSchema = z.object({
  value: z.string(),
  label: z.string(),
  evidenceId: z.string().nullable().optional(),
})

export const caseDraftQuoteSchema = z.object({
  text: z.string(),
  authorLabel: z.string().min(1).default(DEFAULT_ANONYMIZED_AUTHOR_LABEL),
  evidenceId: z.string().nullable().optional(),
  authorRole: z.string().optional(),
  authorCompany: z.string().optional(),
})

export const caseDraftSchema = z.object({
  headline: caseDraftHeadlineSchema.default({ text: '', evidenceId: null }),
  metric: caseDraftMetricSchema,
  problem: z.string().optional().default(''),
  solution: z.string().optional().default(''),
  result: z.string().optional().default(''),
  summaryRows: z.array(summaryRowSchema).default([]),
  quote: caseDraftQuoteSchema,
  tags: z.array(z.string()).default([]),
  missingFields: z.array(z.string()).default([]),
  needsReview: z.array(z.string()).default([]),
})

export const caseCardVariantSchema = z.enum(['dark', 'newspaper', 'whatsapp', 'receipt', 'minimal'])

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
  clientLabel: z.string().min(1),
  consentConfirmed: z.boolean(),
  clientConsentStatus: z.enum(['none', 'pending', 'approved', 'declined']).default('none').optional(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  sources: z.array(sourceSchema).default([]),
  chatMessages: z.array(persistedChatMessageSchema).default([]),
  selectedChatMessages: z.array(persistedChatMessageSchema).default([]),
  messenger: messengerSchema.default('unknown'),
  draft: caseDraftSchema.nullable().optional(),
  selectedVariant: caseCardVariantSchema.default('dark'),
  branding: caseBrandingSchema.default({ showLogo: true }),
  publishedAt: z.number().int().nonnegative().nullable().optional(),
})

export const publicCaseSchema = z.object({
  id: z.string().min(1),
  headline: z.string().default(''),
  metric: z.string().default(''),
  metricLabel: z.string().default(''),
  problem: z.string().default(''),
  solution: z.string().default(''),
  result: z.string().default(''),
  summaryRows: z.array(summaryRowSchema).default([]),
  quote: z.string().default(''),
  author: z.string().default('Клиент'),
  authorRole: z.string().optional(),
  authorCompany: z.string().optional(),
  messenger: messengerSchema.default('unknown'),
  cardMessages: z.array(persistedChatMessageSchema).default([]),
  tags: z.array(z.string()).default([]),
  selectedVariant: caseCardVariantSchema.default('dark'),
  branding: caseBrandingSchema.default({ showLogo: true }),
  companyName: z.string().default(''),
  title: z.string().default(''),
  publishedAt: z.number().int().nonnegative(),
  isVerifiedByChat: z.boolean().default(true),
  ogImageUrl: z.string().nullable().optional(),
})

export type PublicCase = z.infer<typeof publicCaseSchema>
export type ClientConsentStatus = 'none' | 'pending' | 'approved' | 'declined'

export type CaseStatus = z.infer<typeof caseStatusSchema>
export type SourceKind = z.infer<typeof sourceKindSchema>
export type Source = z.infer<typeof sourceSchema>
export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>
export type Transcript = z.infer<typeof transcriptSchema>
export type ChatMessageSide = z.infer<typeof chatMessageSideSchema>
export type MessengerType = z.infer<typeof messengerSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>
export type PersistedChatMessage = z.infer<typeof persistedChatMessageSchema>
export type ChatExtraction = z.infer<typeof chatExtractionSchema>
export type EvidenceKind = z.infer<typeof evidenceKindSchema>
export type Evidence = z.infer<typeof evidenceSchema>
export type CaseDraftHeadline = z.infer<typeof caseDraftHeadlineSchema>
export type SummaryRowOrigin = z.infer<typeof summaryRowOriginSchema>
export type SummaryRow = z.infer<typeof summaryRowSchema>
export type CaseDraftMetric = z.infer<typeof caseDraftMetricSchema>
export type CaseDraftQuote = z.infer<typeof caseDraftQuoteSchema>
export type CaseDraft = z.infer<typeof caseDraftSchema>
export type CaseCardVariantType = z.infer<typeof caseCardVariantSchema>
export type CaseBranding = z.infer<typeof caseBrandingSchema>
export type Case = z.infer<typeof caseSchema>
