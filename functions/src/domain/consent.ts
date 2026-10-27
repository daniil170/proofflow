import { z } from 'zod'

export const consentStatusSchema = z.enum(['pending', 'approved', 'declined'])

export const clientConsentRecordSchema = z.object({
  token: z.string().min(1),
  caseId: z.string().min(1),
  ownerId: z.string().min(1),
  clientLabel: z.string().default(''),
  status: consentStatusSchema.default('pending'),
  createdAt: z.number().int().nonnegative(),
  decidedAt: z.number().int().nonnegative().nullable().optional(),
  clientIp: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  anonymizedCase: z.object({
    metric: z.string(),
    metricLabel: z.string(),
    problem: z.string(),
    solution: z.string(),
    result: z.string(),
    quote: z.string(),
    author: z.string(),
    company: z.string().optional(),
  }),
})

export type ConsentStatus = z.infer<typeof consentStatusSchema>
export type ClientConsentRecord = z.infer<typeof clientConsentRecordSchema>
