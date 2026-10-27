import { z } from 'zod'

export const applicationStatusSchema = z.enum([
  'new',
  'approved',
  'rejected',
  'invited',
  'activated',
])

export const applicationChannelSchema = z.enum(['web', 'telegram'])

export const applicationHistoryEntrySchema = z.object({
  action: z.string().min(1),
  timestamp: z.number().int().positive(),
  performedBy: z.string().min(1),
  note: z.string().optional(),
})

export const applicationSchema = z.object({
  id: z.string().min(1),
  source: z.string().optional().default('web'),
  channel: applicationChannelSchema.default('web'),
  email: z.string().email().nullable().optional(),
  telegramUsername: z.string().nullable().optional(),
  telegramUserId: z.union([z.string(), z.number()]).nullable().optional(),
  businessType: z.string().default('agency_or_studio'),
  casesVolume: z.string().default('1_to_3'),
  currentProcess: z.string().optional().default(''),
  feedbackText: z.string().optional(),
  consent: z.boolean().default(true),
  status: applicationStatusSchema.default('new'),
  rejectReason: z.string().optional(),
  ownerNote: z.string().optional(),
  inviteCode: z.string().optional(),
  invitedAt: z.number().int().positive().optional(),
  activatedAt: z.number().int().positive().optional(),
  history: z.array(applicationHistoryEntrySchema).default([]),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive().optional(),
})

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>
export type ApplicationChannel = z.infer<typeof applicationChannelSchema>
export type ApplicationHistoryEntry = z.infer<typeof applicationHistoryEntrySchema>
export type Application = z.infer<typeof applicationSchema>
