import { z } from 'zod'
import { caseBrandingSchema, caseCardVariantSchema } from './schemas.js'

export const publicCaseSchema = z.object({
  id: z.string().min(1),
  metric: z.string(),
  metricLabel: z.string(),
  problem: z.string(),
  solution: z.string(),
  result: z.string(),
  quote: z.string(),
  author: z.string(),
  authorRole: z.string().optional(),
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
