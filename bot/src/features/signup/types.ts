import type { ConversationStep, VoiceAttachment } from '../../entities/index.js'

export interface SignupSessionData {
  step: ConversationStep
  deepLink?: string
  businessType?: string
  casesVolume?: string
  feedbackText?: string
  voiceAttachment?: VoiceAttachment
  existingApplicationId?: string
  linkToken?: string
  linkedUserId?: string
  linkError?: string
}

export type SignupAction =
  | { type: 'START'; deepLink?: string }
  | { type: 'START_LINK'; token: string }
  | { type: 'LINK_SUCCESS'; uid: string }
  | { type: 'LINK_FAILED'; error: string }
  | { type: 'SELECT_HOW_IT_WORKS' }
  | { type: 'SELECT_BUSINESS_TYPE'; payload: string }
  | { type: 'SELECT_CASES_VOLUME'; payload: string }
  | { type: 'SUBMIT_FEEDBACK_TEXT'; payload: string }
  | { type: 'SUBMIT_FEEDBACK_VOICE'; fileId: string; duration: number }
  | { type: 'SKIP_FEEDBACK' }
  | { type: 'SUBMIT_CONSENT'; agreed: boolean }
  | { type: 'UPDATE_FEEDBACK_START' }
  | { type: 'RESET' }
