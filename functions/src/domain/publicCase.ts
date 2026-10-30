import { z } from 'zod'
import {
  caseBrandingSchema,
  caseCardVariantSchema,
  messengerSchema,
  persistedChatMessageSchema,
  summaryRowSchema,
} from './schemas.js'

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
