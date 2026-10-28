export interface IdeaVote {
  readonly id: string
  readonly ideaId: string
  readonly telegramUserId: number
  readonly createdAt: Date | string
}
