import type { IdeaSessionData } from './types.js'
import { TEXTS } from '../../shared/texts.js'

export const initialIdeaSessionData: IdeaSessionData = Object.freeze({
  step: 'idle',
})

export type IdeaAction =
  | { type: 'START' }
  | { type: 'SELECT_CATEGORY'; payload: string }
  | { type: 'SET_DESCRIPTION'; text?: string; voiceFileId?: string }
  | { type: 'SET_CONTEXT'; payload?: string }
  | { type: 'CANCEL' }

export interface IdeaTransitionResult {
  nextState: IdeaSessionData
  errorKey?: 'textTooLong' | 'emptyDescription'
}

export const sanitizeIdeaText = (input: string): string => {
  let cleaned = input.replace(/https?:\/\//gi, '').replace(/www\./gi, 'www[.]')
  while (cleaned.match(/([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)/)) {
    cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)/g, '$1[.]$2')
  }
  return cleaned.trim()
}

export const ideaReducer = (
  state: IdeaSessionData = initialIdeaSessionData,
  action: IdeaAction
): IdeaTransitionResult => {
  switch (action.type) {
    case 'START':
      return {
        nextState: {
          step: 'awaiting_category',
        },
      }

    case 'SELECT_CATEGORY': {
      const isValid = TEXTS.ideas.categories.includes(
        action.payload as (typeof TEXTS.ideas.categories)[number]
      )
      if (!isValid) {
        return { nextState: state }
      }
      return {
        nextState: {
          ...state,
          step: 'awaiting_description',
          category: action.payload,
        },
      }
    }

    case 'SET_DESCRIPTION': {
      if (state.step !== 'awaiting_description') {
        return { nextState: state }
      }

      if (action.text) {
        const trimmed = action.text.trim()
        if (trimmed.length > 2000) {
          return { nextState: state, errorKey: 'textTooLong' }
        }
        if (!trimmed) {
          return { nextState: state, errorKey: 'emptyDescription' }
        }
        return {
          nextState: {
            ...state,
            step: 'awaiting_context',
            text: sanitizeIdeaText(trimmed),
            voiceFileId: undefined,
          },
        }
      }

      if (action.voiceFileId) {
        return {
          nextState: {
            ...state,
            step: 'awaiting_context',
            voiceFileId: action.voiceFileId,
            text: undefined,
          },
        }
      }

      return { nextState: state, errorKey: 'emptyDescription' }
    }

    case 'SET_CONTEXT': {
      if (state.step !== 'awaiting_context') {
        return { nextState: state }
      }

      const trimmed = action.payload?.trim()
      const sanitized = trimmed ? sanitizeIdeaText(trimmed) : undefined

      return {
        nextState: {
          ...state,
          context: sanitized,
          step: 'idle',
        },
      }
    }

    case 'CANCEL':
      return {
        nextState: { ...initialIdeaSessionData },
      }

    default:
      return { nextState: state }
  }
}
