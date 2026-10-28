import type { IdeaVote } from '../../entities/index.js'

export interface IdeaVoteRepository {
  addVote(ideaId: string, telegramUserId: number): Promise<boolean>
  removeVote(ideaId: string, telegramUserId: number): Promise<boolean>
  hasVoted(ideaId: string, telegramUserId: number): Promise<boolean>
  findVotesByUser(telegramUserId: number): Promise<IdeaVote[]>
  deleteByTelegramUserId(telegramUserId: number): Promise<IdeaVote[]>
  deleteByIdeaId(ideaId: string): Promise<number>
}
