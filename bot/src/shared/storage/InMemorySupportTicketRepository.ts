import type { SupportTicket, TicketMessage } from '../../entities/index.js'
import type { SupportTicketRepository } from './SupportTicketRepository.js'

export class InMemorySupportTicketRepository implements SupportTicketRepository {
  private tickets: Map<string, SupportTicket> = new Map()
  private counter = 100

  async create(
    ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'lastMessageAt'>
  ): Promise<SupportTicket> {
    this.counter += 1
    const id = String(this.counter)
    const now = new Date().toISOString()
    const ticket: SupportTicket = {
      ...ticketData,
      id,
      createdAt: now,
      lastMessageAt: now,
    }
    this.tickets.set(id, ticket)
    return { ...ticket }
  }

  async findById(id: string): Promise<SupportTicket | null> {
    const ticket = this.tickets.get(id)
    return ticket ? { ...ticket } : null
  }

  async findByAdminMessageId(adminMessageId: number): Promise<SupportTicket | null> {
    for (const ticket of this.tickets.values()) {
      if (ticket.adminMessageId === adminMessageId) {
        return { ...ticket }
      }
    }
    return null
  }

  async findOpenByTelegramUserId(
    telegramUserId: number
  ): Promise<SupportTicket | null> {
    const now = Date.now()
    const DAY_MS = 24 * 60 * 60 * 1000

    for (const ticket of this.tickets.values()) {
      if (ticket.telegramUserId === telegramUserId && ticket.status === 'open') {
        const lastMsgTime = new Date(ticket.lastMessageAt).getTime()
        if (now - lastMsgTime <= DAY_MS) {
          return { ...ticket }
        }
      }
    }
    return null
  }

  async update(
    id: string,
    updates: Partial<SupportTicket>
  ): Promise<SupportTicket> {
    const existing = this.tickets.get(id)
    if (!existing) {
      throw new Error(`Ticket with id ${id} not found`)
    }
    const updated: SupportTicket = {
      ...existing,
      ...updates,
    }
    this.tickets.set(id, updated)
    return { ...updated }
  }

  async appendMessage(
    id: string,
    message: TicketMessage
  ): Promise<SupportTicket> {
    const existing = this.tickets.get(id)
    if (!existing) {
      throw new Error(`Ticket with id ${id} not found`)
    }
    const now = new Date().toISOString()
    const updated: SupportTicket = {
      ...existing,
      messages: [...existing.messages, message],
      lastMessageAt: now,
    }
    this.tickets.set(id, updated)
    return { ...updated }
  }

  async countDailyByUser(telegramUserId: number, since: Date): Promise<number> {
    const sinceTime = since.getTime()
    let count = 0
    for (const ticket of this.tickets.values()) {
      if (ticket.telegramUserId === telegramUserId) {
        const createdTime = new Date(ticket.createdAt).getTime()
        if (createdTime >= sinceTime) {
          count += 1
        }
      }
    }
    return count
  }

  async deleteByTelegramUserId(telegramUserId: number): Promise<number> {
    let deleted = 0
    for (const [id, ticket] of this.tickets.entries()) {
      if (ticket.telegramUserId === telegramUserId) {
        this.tickets.delete(id)
        deleted += 1
      }
    }
    return deleted
  }

  clear(): void {
    this.tickets.clear()
    this.counter = 100
  }
}
