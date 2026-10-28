export type SupportStep =
  | 'idle'
  | 'awaiting_topic'
  | 'awaiting_description'
  | 'awaiting_confirmation'

export interface SupportAttachment {
  readonly fileId: string
  readonly type: 'photo' | 'voice' | 'document'
  readonly messageId?: number
}

export interface SupportSessionData {
  step: SupportStep
  topic?: string
  text?: string
  attachments: SupportAttachment[]
}
