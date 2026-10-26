import type { Context, SessionFlavor } from 'grammy'
import type { SignupSessionData } from '../features/signup/types.js'

export interface SessionData {
  signup: SignupSessionData
  deleteConfirmation?: boolean
}

export type BotContext = Context & SessionFlavor<SessionData>
