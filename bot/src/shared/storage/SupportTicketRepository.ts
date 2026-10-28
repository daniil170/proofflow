import type { SupportTicket, TicketMessage } from '../../entities/index.js'

export interface SupportTicketRepository {
  create(
    ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'lastMessageAt'>
  ): Promise<SupportTicket>
  findById(id: string): Promise<SupportTicket | null>
  findByAdminMessageId(adminMessageId: number): Promise<SupportTicket | null>
  findOpenByTelegramUserId(telegramUserId: number): Promise<SupportTicket | null>
  update(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket>
  appendMessage(id: string, message: TicketMessage): Promise<SupportTicket>
  countDailyByUser(telegramUserId: number, since: Date): Promise<number>
  deleteByTelegramUserId(telegramUserId: number): Promise<number>
}
