import type { Idea } from '../../entities/index.js'

export interface IdeaRepository {
  create(
    idea: Omit<Idea, 'id' | 'createdAt' | 'votesCount'>
  ): Promise<Idea>
  findById(id: string): Promise<Idea | null>
  findByAdminMessageId(adminMessageId: number): Promise<Idea | null>
  update(id: string, updates: Partial<Idea>): Promise<Idea>
  findPublicTextIdeas(
    limit: number,
    offset: number
  ): Promise<{ items: Idea[]; total: number }>
  countDailyByUser(telegramUserId: number, since: Date): Promise<number>
  deleteByTelegramUserId(telegramUserId: number): Promise<number>
  incrementVote(id: string, delta: number): Promise<number>
}
