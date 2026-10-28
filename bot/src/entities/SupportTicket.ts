export type TicketStatus = 'open' | 'closed'
export type TicketMessageType = 'text' | 'photo' | 'voice' | 'document'
export type TicketMessageDirection = 'user' | 'team'

export interface TicketAttachment {
  readonly fileId: string
  readonly type: Exclude<TicketMessageType, 'text'>
}

export interface TicketMessage {
  readonly id?: string
  readonly direction: TicketMessageDirection
  readonly type: TicketMessageType
  readonly text?: string
  readonly fileId?: string
  readonly createdAt: Date | string
}

export interface SupportTicket {
  readonly id: string
  readonly telegramUserId: number
  readonly username?: string
  readonly topic: string
  readonly source?: string
  readonly status: TicketStatus
  readonly messages: TicketMessage[]
  readonly adminMessageId?: number
  readonly createdAt: Date | string
  readonly lastMessageAt: Date | string
}
