import type { Idea } from '../../entities/index.js'
import type { IdeaRepository } from './IdeaRepository.js'

export class InMemoryIdeaRepository implements IdeaRepository {
  private ideas: Map<string, Idea> = new Map()
  private counter = 500

  async create(
    ideaData: Omit<Idea, 'id' | 'createdAt' | 'votesCount'>
  ): Promise<Idea> {
    this.counter += 1
    const id = String(this.counter)
    const now = new Date().toISOString()
    const idea: Idea = {
      ...ideaData,
      id,
      votesCount: 0,
      createdAt: now,
    }
    this.ideas.set(id, idea)
    return { ...idea }
  }

  async findById(id: string): Promise<Idea | null> {
    const found = this.ideas.get(id)
    return found ? { ...found } : null
  }

  async findByAdminMessageId(adminMessageId: number): Promise<Idea | null> {
    for (const idea of this.ideas.values()) {
      if (idea.adminMessageId === adminMessageId) {
        return { ...idea }
      }
    }
    return null
  }

  async update(id: string, updates: Partial<Idea>): Promise<Idea> {
    const existing = this.ideas.get(id)
    if (!existing) {
      throw new Error(`Idea with id ${id} not found`)
    }
    const updated: Idea = {
      ...existing,
      ...updates,
    }
    this.ideas.set(id, updated)
    return { ...updated }
  }

  async findPublicTextIdeas(
    limit: number,
    offset: number
  ): Promise<{ items: Idea[]; total: number }> {
    const all = Array.from(this.ideas.values()).filter(
      (idea) =>
        idea.moderationStatus === 'public' &&
        Boolean(idea.text && idea.text.trim().length > 0)
    )

    all.sort((a, b) => {
      if (b.votesCount !== a.votesCount) {
        return b.votesCount - a.votesCount
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const total = all.length
    const items = all.slice(offset, offset + limit).map((i) => ({ ...i }))
    return { items, total }
  }

  async countDailyByUser(telegramUserId: number, since: Date): Promise<number> {
    const sinceTime = since.getTime()
    let count = 0
    for (const idea of this.ideas.values()) {
      if (idea.telegramUserId === telegramUserId) {
        const createdTime = new Date(idea.createdAt).getTime()
        if (createdTime >= sinceTime) {
          count += 1
        }
      }
    }
    return count
  }

  async deleteByTelegramUserId(telegramUserId: number): Promise<number> {
    let deleted = 0
    for (const [id, idea] of this.ideas.entries()) {
      if (idea.telegramUserId === telegramUserId) {
        this.ideas.delete(id)
        deleted += 1
      }
    }
    return deleted
  }

  async incrementVote(id: string, delta: number): Promise<number> {
    const existing = this.ideas.get(id)
    if (!existing) {
      throw new Error(`Idea with id ${id} not found`)
    }
    const newVotes = Math.max(0, existing.votesCount + delta)
    const updated: Idea = {
      ...existing,
      votesCount: newVotes,
    }
    this.ideas.set(id, updated)
    return newVotes
  }

  clear(): void {
    this.ideas.clear()
    this.counter = 500
  }
}
