import { describe, expect, it } from 'vitest'
import {
  applicationChannelSchema,
  applicationSchema,
  applicationStatusSchema,
} from '../schemas.ts'

describe('Application schemas', () => {
  it('validates status and channel enums', () => {
    expect(applicationStatusSchema.safeParse('new').success).toBe(true)
    expect(applicationStatusSchema.safeParse('approved').success).toBe(true)
    expect(applicationStatusSchema.safeParse('rejected').success).toBe(true)
    expect(applicationStatusSchema.safeParse('invited').success).toBe(true)
    expect(applicationStatusSchema.safeParse('activated').success).toBe(true)
    expect(applicationStatusSchema.safeParse('other').success).toBe(false)

    expect(applicationChannelSchema.safeParse('web').success).toBe(true)
    expect(applicationChannelSchema.safeParse('telegram').success).toBe(true)
    expect(applicationChannelSchema.safeParse('unknown').success).toBe(false)
  })

  it('validates valid application object with defaults', () => {
    const raw = {
      id: 'app-1',
      email: 'client@example.com',
      createdAt: Date.now(),
    }

    const parsed = applicationSchema.safeParse(raw)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.status).toBe('new')
      expect(parsed.data.channel).toBe('web')
      expect(parsed.data.history).toEqual([])
    }
  })
})
