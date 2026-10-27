import type { BetaApplication } from '../../entities/index.js'
import type { BetaApplicationRepository } from './BetaApplicationRepository.js'

export class InMemoryBetaApplicationRepository implements BetaApplicationRepository {
  private readonly store: Map<string, BetaApplication> = new Map()

  async findByTelegramUserId(telegramUserId: number): Promise<BetaApplication | null> {
    for (const app of this.store.values()) {
      if (app.telegramUserId === telegramUserId && !app.unsubscribed) {
        return app
      }
    }
    return null
  }

  async create(
    application: Omit<BetaApplication, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BetaApplication> {
    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date()
    const saved: BetaApplication = {
      ...application,
      id,
      channel: 'telegram',
      source: 'telegram',
      status: application.status || 'new',
      email: null,
      currentProcess: application.feedbackText || application.currentProcess || '',
      createdAt: now,
      updatedAt: now,
    }
    this.store.set(id, saved)
    return saved
  }

  async update(id: string, updates: Partial<BetaApplication>): Promise<BetaApplication> {
    const existing = this.store.get(id)
    if (!existing) {
      throw new Error(`Application with id ${id} not found`)
    }
    const updated: BetaApplication = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    }
    this.store.set(id, updated)
    return updated
  }

  async deleteByTelegramUserId(telegramUserId: number): Promise<boolean> {
    let deleted = false
    for (const [id, app] of this.store.entries()) {
      if (app.telegramUserId === telegramUserId) {
        this.store.delete(id)
        deleted = true
      }
    }
    return deleted
  }

  async setUnsubscribed(telegramUserId: number, unsubscribed: boolean): Promise<boolean> {
    let found = false
    for (const [id, app] of this.store.entries()) {
      if (app.telegramUserId === telegramUserId) {
        this.store.set(id, {
          ...app,
          unsubscribed,
          updatedAt: new Date(),
        })
        found = true
      }
    }
    return found
  }

  clear(): void {
    this.store.clear()
  }

  getAll(): BetaApplication[] {
    return Array.from(this.store.values())
  }
}
