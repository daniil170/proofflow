import { describe, expect, it } from 'vitest'
import {
  inviteChannelSchema,
  inviteSchema,
  inviteStatusSchema,
} from '../schemas.ts'

describe('Invite schemas', () => {
  it('validates inviteStatus and inviteChannel', () => {
    expect(inviteStatusSchema.safeParse('issued').success).toBe(true)
    expect(inviteStatusSchema.safeParse('used').success).toBe(true)
    expect(inviteStatusSchema.safeParse('revoked').success).toBe(true)
    expect(inviteStatusSchema.safeParse('invalid').success).toBe(false)

    expect(inviteChannelSchema.safeParse('web').success).toBe(true)
    expect(inviteChannelSchema.safeParse('telegram').success).toBe(true)
    expect(inviteChannelSchema.safeParse('email').success).toBe(false)
  })

  it('validates complete invite schema', () => {
    const validInvite = {
      code: 'BETA2026',
      status: 'issued',
      expiresAt: Date.now() + 86400000,
      channel: 'web',
      createdBy: 'admin-1',
      createdAt: Date.now(),
    }

    expect(inviteSchema.safeParse(validInvite).success).toBe(true)
  })

  it('rejects invite with missing mandatory fields', () => {
    const invalid = {
      code: '',
      status: 'issued',
    }
    expect(inviteSchema.safeParse(invalid).success).toBe(false)
  })
})
