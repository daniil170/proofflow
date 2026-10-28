import type { SupportAttachment, SupportSessionData } from './types.js'
import { TEXTS } from '../../shared/texts.js'

export const initialSupportSessionData: SupportSessionData = Object.freeze({
  step: 'idle',
  attachments: [],
})

export type SupportAction =
  | { type: 'START' }
  | { type: 'SELECT_TOPIC'; payload: string }
  | {
      type: 'ADD_CONTENT'
      payload: { text?: string; attachment?: SupportAttachment }
    }
  | { type: 'CONFIRM' }
  | { type: 'CANCEL' }

export interface SupportTransitionResult {
  nextState: SupportSessionData
  errorKey?: 'tooManyAttachments' | 'textTooLong' | 'emptyMessage'
}

export const supportReducer = (
  state: SupportSessionData = initialSupportSessionData,
  action: SupportAction
): SupportTransitionResult => {
  switch (action.type) {
    case 'START':
      return {
        nextState: {
          step: 'awaiting_topic',
          attachments: [],
        },
      }

    case 'SELECT_TOPIC': {
      const isValid = TEXTS.support.topics.includes(
        action.payload as (typeof TEXTS.support.topics)[number]
      )
      if (!isValid) {
        return { nextState: state }
      }
      return {
        nextState: {
          ...state,
          step: 'awaiting_description',
          topic: action.payload,
          attachments: [],
        },
      }
    }

    case 'ADD_CONTENT': {
      if (state.step !== 'awaiting_description' && state.step !== 'awaiting_confirmation') {
        return { nextState: state }
      }

      let newText = state.text
      if (action.payload.text !== undefined) {
        const trimmed = action.payload.text.trim()
        if (trimmed.length > 2000) {
          return { nextState: state, errorKey: 'textTooLong' }
        }
        newText = trimmed || undefined
      }

      const newAttachments = [...state.attachments]
      if (action.payload.attachment) {
        if (newAttachments.length >= 5) {
          return { nextState: state, errorKey: 'tooManyAttachments' }
        }
        newAttachments.push(action.payload.attachment)
      }

      if (!newText && newAttachments.length === 0) {
        return { nextState: state, errorKey: 'emptyMessage' }
      }

      return {
        nextState: {
          ...state,
          step: 'awaiting_confirmation',
          text: newText,
          attachments: newAttachments,
        },
      }
    }

    case 'CONFIRM':
      return {
        nextState: { ...initialSupportSessionData },
      }

    case 'CANCEL':
      return {
        nextState: { ...initialSupportSessionData },
      }

    default:
      return { nextState: state }
  }
}
