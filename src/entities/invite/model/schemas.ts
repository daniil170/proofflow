import { z } from 'zod'

export const inviteStatusSchema = z.enum(['issued', 'used', 'revoked'])

export const inviteChannelSchema = z.enum(['web', 'telegram'])

export const inviteSchema = z.object({
  code: z.string().trim().min(1),
  status: inviteStatusSchema,
  expiresAt: z.number().int().positive(),
  usedBy: z.string().nullable().optional(),
  applicationId: z.string().nullable().optional(),
  channel: inviteChannelSchema,
  email: z.string().email().nullable().optional(),
  telegramUserId: z.union([z.string(), z.number()]).nullable().optional(),
  createdBy: z.string().min(1),
  createdAt: z.number().int().positive(),
  usedAt: z.number().int().positive().nullable().optional(),
})

export type InviteStatus = z.infer<typeof inviteStatusSchema>
export type InviteChannel = z.infer<typeof inviteChannelSchema>
export type Invite = z.infer<typeof inviteSchema>
