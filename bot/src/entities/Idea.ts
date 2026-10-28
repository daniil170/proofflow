export type IdeaCategory =
  | 'Новая функция'
  | 'Улучшение того, что есть'
  | 'Интеграция'
  | 'Другое'

export type IdeaModerationStatus = 'pending' | 'public' | 'hidden'

export interface Idea {
  readonly id: string
  readonly telegramUserId: number
  readonly category: string
  readonly text?: string
  readonly voiceFileId?: string
  readonly context?: string
  readonly moderationStatus: IdeaModerationStatus
  readonly votesCount: number
  readonly adminMessageId?: number
  readonly createdAt: Date | string
}
