export type SignupSource = 'web' | 'telegram'

export interface VoiceAttachment {
  readonly fileId: string
  readonly duration: number
}

export interface BetaApplication {
  readonly id?: string
  readonly source: SignupSource
  readonly deepLink?: string
  readonly telegramUserId: number
  readonly telegramUsername?: string
  readonly businessType: string
  readonly casesVolume: string
  readonly feedbackText?: string
  readonly voiceAttachment?: VoiceAttachment
  readonly consent: boolean
  readonly unsubscribed?: boolean
  readonly createdAt?: Date | string | null
  readonly updatedAt?: Date | string | null
}
