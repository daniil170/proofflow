import type { Context, SessionFlavor } from 'grammy'
import type { SignupSessionData } from '../features/signup/types.js'
import type { SupportSessionData } from '../features/support/types.js'
import type { IdeaSessionData } from '../features/ideas/types.js'

export interface SessionData {
  signup: SignupSessionData
  support?: SupportSessionData
  idea?: IdeaSessionData
  deleteConfirmation?: boolean
}

export type BotContext = Context & SessionFlavor<SessionData>
