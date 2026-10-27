import { describe, expect, it } from 'vitest'
import {
  accessStatusSchema,
  consentRecordSchema,
  userProfileSchema,
  userRecordSchema,
} from '../schemas.ts'

describe('User schemas', () => {
  it('validates accessStatus', () => {
    expect(accessStatusSchema.safeParse('waitlist').success).toBe(true)
    expect(accessStatusSchema.safeParse('active').success).toBe(true)
    expect(accessStatusSchema.safeParse('blocked').success).toBe(true)
    expect(accessStatusSchema.safeParse('unknown').success).toBe(false)
  })

  it('validates userProfileSchema with required and optional fields', () => {
    const validProfile = {
      displayName: 'Алексей',
      companyName: 'Студия Развития',
      businessType: 'agency_or_studio',
      websiteUrl: 'https://example.com',
      currentProcessNote: 'Делаем презентации вручную',
      logoPath: null,
    }

    const parsed = userProfileSchema.safeParse(validProfile)
    expect(parsed.success).toBe(true)

    const invalid = userProfileSchema.safeParse({
      displayName: '',
      companyName: '   ',
      businessType: '',
    })
    expect(invalid.success).toBe(false)
  })

  it('validates userRecordSchema and rejects invalid values', () => {
    const validRecord = {
      id: 'usr-1',
      email: 'test@example.com',
      accessStatus: 'waitlist',
      workspaceId: 'usr-1',
    }
    expect(userRecordSchema.safeParse(validRecord).success).toBe(true)

    const invalidRecord = {
      id: '',
      accessStatus: 'invalid_status',
      workspaceId: '',
    }
    expect(userRecordSchema.safeParse(invalidRecord).success).toBe(false)
  })

  it('validates consentRecordSchema', () => {
    const consent = {
      documentVersion: '2026-10-v1',
      acceptedAt: Date.now(),
    }
    expect(consentRecordSchema.safeParse(consent).success).toBe(true)
  })
})
