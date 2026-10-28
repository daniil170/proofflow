import type { IdeaVote } from '../../entities/index.js'
import type { IdeaVoteRepository } from './IdeaVoteRepository.js'

export class InMemoryIdeaVoteRepository implements IdeaVoteRepository {
  private votes: Map<string, IdeaVote> = new Map()

  private makeKey(ideaId: string, telegramUserId: number): string {
    return `${ideaId}_${telegramUserId}`
  }

  async addVote(ideaId: string, telegramUserId: number): Promise<boolean> {
    const key = this.makeKey(ideaId, telegramUserId)
    if (this.votes.has(key)) {
      return false
    }
    const vote: IdeaVote = {
      id: key,
      ideaId,
      telegramUserId,
      createdAt: new Date().toISOString(),
    }
    this.votes.set(key, vote)
    return true
  }

  async removeVote(ideaId: string, telegramUserId: number): Promise<boolean> {
    const key = this.makeKey(ideaId, telegramUserId)
    if (!this.votes.has(key)) {
      return false
    }
    this.votes.delete(key)
    return true
  }

  async hasVoted(ideaId: string, telegramUserId: number): Promise<boolean> {
    return this.votes.has(this.makeKey(ideaId, telegramUserId))
  }

  async findVotesByUser(telegramUserId: number): Promise<IdeaVote[]> {
    const res: IdeaVote[] = []
    for (const vote of this.votes.values()) {
      if (vote.telegramUserId === telegramUserId) {
        res.push({ ...vote })
      }
    }
    return res
  }

  async deleteByTelegramUserId(telegramUserId: number): Promise<IdeaVote[]> {
    const removed: IdeaVote[] = []
    for (const [key, vote] of this.votes.entries()) {
      if (vote.telegramUserId === telegramUserId) {
        removed.push({ ...vote })
        this.votes.delete(key)
      }
    }
    return removed
  }

  async deleteByIdeaId(ideaId: string): Promise<number> {
    let count = 0
    for (const [key, vote] of this.votes.entries()) {
      if (vote.ideaId === ideaId) {
        this.votes.delete(key)
        count += 1
      }
    }
    return count
  }

  clear(): void {
    this.votes.clear()
  }
}
