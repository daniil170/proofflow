export interface CaseData {
  readonly metric: string
  readonly metricLabel: string
  readonly before: string
  readonly done: string
  readonly after: string
  readonly quote: string
  readonly author: string
  readonly company: string
  readonly isVerifiedByChat: boolean
  readonly title?: string
  readonly category?: string
  readonly date?: string
  readonly niche?: string
  readonly channel?: string
  readonly duration?: string
  readonly chatMessages?: readonly string[]
}

export type CaseCardVariant = 'dark' | 'newspaper' | 'whatsapp' | 'receipt' | 'minimal'
