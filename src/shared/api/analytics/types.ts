export const ANALYTICS_EVENTS = [
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
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number]

export interface AnalyticsEvent {
  readonly eventName: AnalyticsEventName
  readonly userId?: string | null
  readonly caseId?: string | null
  readonly timestamp?: number
  readonly metadata?: Readonly<Record<string, unknown>>
}

export interface AnalyticsGateway {
  trackEvent: (event: AnalyticsEvent) => Promise<void>
  getEvents?: () => Promise<readonly AnalyticsEvent[]>
  clearEvents?: () => void
}
