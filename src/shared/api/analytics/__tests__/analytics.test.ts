import { describe, expect, it } from 'vitest'
import { ANALYTICS_EVENTS } from '../types.ts'
import { sanitizeMetadata } from '../firestoreAnalyticsGateway.js'
import { createMockAnalyticsGateway } from '../mockAnalyticsGateway.js'

describe('Analytics system', () => {
  it('defines all 12 required beta events', () => {
    const required = [
      'case_started',
      'files_uploaded',
      'processing_done',
      'processing_failed',
      'review_opened',
      'field_edited',
      'case_confirmed',
      'style_selected',
      'embed_copied',
      'link_copied',
      'png_downloaded',
      'feedback_given',
    ]

    for (const ev of required) {
      expect(ANALYTICS_EVENTS).toContain(ev)
    }
    expect(ANALYTICS_EVENTS.length).toBe(12)
  })

  it('sanitizes metadata by stripping PII and non-primitives', () => {
    const raw = {
      email: 'secret@example.com',
      phone: '+79991234567',
      displayName: 'Alice Johnson',
      field: 'metric',
      variant: 'dark',
      rating: 'positive',
      count: 5,
      isPublished: true,
      nested: { foo: 'bar' },
    }

    const sanitized = sanitizeMetadata(raw)

    expect(sanitized.email).toBeUndefined()
    expect(sanitized.phone).toBeUndefined()
    expect(sanitized.displayName).toBeUndefined()
    expect(sanitized.nested).toBeUndefined()

    expect(sanitized.field).toBe('metric')
    expect(sanitized.variant).toBe('dark')
    expect(sanitized.rating).toBe('positive')
    expect(sanitized.count).toBe(5)
    expect(sanitized.isPublished).toBe(true)
  })

  it('mockAnalyticsGateway tracks, returns and clears events', async () => {
    const gateway = createMockAnalyticsGateway()
    gateway.clearEvents()

    await gateway.trackEvent({
      eventName: 'case_started',
      userId: 'user-42',
      caseId: 'case-100',
      metadata: { source: 'web' },
    })

    await gateway.trackEvent({
      eventName: 'case_confirmed',
      userId: 'user-42',
      caseId: 'case-100',
    })

    const events = await gateway.getEvents()
    expect(events.length).toBe(2)
    expect(events[0].eventName).toBe('case_started')
    expect(events[0].userId).toBe('user-42')
    expect(events[0].metadata?.source).toBe('web')
    expect(events[1].eventName).toBe('case_confirmed')

    gateway.clearEvents()
    const cleared = await gateway.getEvents()
    expect(cleared.length).toBe(0)
  })
})
