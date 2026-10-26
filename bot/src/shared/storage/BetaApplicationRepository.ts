import type { BetaApplication } from '../../entities/index.js'

export interface BetaApplicationRepository {
  findByTelegramUserId(telegramUserId: number): Promise<BetaApplication | null>
  create(
    application: Omit<BetaApplication, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BetaApplication>
  update(id: string, updates: Partial<BetaApplication>): Promise<BetaApplication>
  deleteByTelegramUserId(telegramUserId: number): Promise<boolean>
  setUnsubscribed(telegramUserId: number, unsubscribed: boolean): Promise<boolean>
}
