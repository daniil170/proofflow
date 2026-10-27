import { z } from 'zod'

export const accessStatusSchema = z.enum(['waitlist', 'active', 'blocked'])

export const consentRecordSchema = z.object({
  documentVersion: z.string().min(1),
  acceptedAt: z.number().int().positive(),
})

export const userProfileSchema = z.object({
  displayName: z.string().trim().min(1, 'Укажите ваше имя'),
  companyName: z.string().trim().min(1, 'Укажите название компании или проекта'),
  businessType: z.string().min(1, 'Выберите сферу деятельности'),
  websiteUrl: z
    .string()
    .trim()
    .url('Введите корректный URL сайта (например, https://example.com)')
    .or(z.literal(''))
    .optional(),
  currentProcessNote: z.string().trim().max(1000).optional(),
  logoPath: z.string().nullable().optional(),
})

export const userRecordSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().or(z.literal('')).optional(),
  accessStatus: accessStatusSchema,
  workspaceId: z.string().min(1),
  profile: userProfileSchema.optional(),
  consent: consentRecordSchema.optional(),
  telegramUserId: z.union([z.string(), z.number()]).optional(),
  createdAt: z.number().int().positive().optional(),
  updatedAt: z.number().int().positive().optional(),
})

export type AccessStatus = z.infer<typeof accessStatusSchema>
export type ConsentRecord = z.infer<typeof consentRecordSchema>
export type UserProfile = z.infer<typeof userProfileSchema>
export type UserRecord = z.infer<typeof userRecordSchema>
