import type { SignupAction, SignupSessionData } from './types.js'
import { TEXTS } from '../../shared/texts.js'

export interface MachineTransitionResult {
  nextState: SignupSessionData
  errorKey?: keyof typeof TEXTS.validation
  shouldSave?: boolean
  shouldUpdate?: boolean
  disagreed?: boolean
}

export const initialSessionData: SignupSessionData = Object.freeze({
  step: 'idle',
})

export const signupReducer = (
  state: SignupSessionData,
  action: SignupAction
): MachineTransitionResult => {
  switch (action.type) {
    case 'RESET': {
      return {
        nextState: { ...initialSessionData },
      }
    }

    case 'START': {
      return {
        nextState: {
          step: 'awaiting_business_type',
          deepLink: action.deepLink || state.deepLink,
        },
      }
    }

    case 'SELECT_HOW_IT_WORKS': {
      return {
        nextState: {
          ...state,
          step: 'idle',
        },
      }
    }

    case 'SELECT_BUSINESS_TYPE': {
      if (state.step !== 'awaiting_business_type') {
        return {
          nextState: state,
          errorKey: 'selectButton',
        }
      }
      const isValid = (TEXTS.options.businessTypes as readonly string[]).includes(action.payload)
      if (!isValid) {
        return {
          nextState: state,
          errorKey: 'selectButton',
        }
      }
      return {
        nextState: {
          ...state,
          businessType: action.payload,
          step: 'awaiting_cases_volume',
        },
      }
    }

    case 'SELECT_CASES_VOLUME': {
      if (state.step !== 'awaiting_cases_volume') {
        return {
          nextState: state,
          errorKey: 'selectButton',
        }
      }
      const isValid = (TEXTS.options.casesVolumes as readonly string[]).includes(action.payload)
      if (!isValid) {
        return {
          nextState: state,
          errorKey: 'selectButton',
        }
      }
      return {
        nextState: {
          ...state,
          casesVolume: action.payload,
          step: 'awaiting_feedback',
        },
      }
    }

    case 'SUBMIT_FEEDBACK_TEXT': {
      if (state.step !== 'awaiting_feedback') {
        return {
          nextState: state,
          errorKey: 'feedbackExpected',
        }
      }
      const text = action.payload.trim()
      if (!text) {
        return {
          nextState: state,
          errorKey: 'feedbackExpected',
        }
      }

      if (state.existingApplicationId) {
        return {
          nextState: {
            ...state,
            feedbackText: text,
            voiceAttachment: undefined,
            step: 'completed',
          },
          shouldUpdate: true,
        }
      }

      return {
        nextState: {
          ...state,
          feedbackText: text,
          voiceAttachment: undefined,
          step: 'awaiting_consent',
        },
      }
    }

    case 'SUBMIT_FEEDBACK_VOICE': {
      if (state.step !== 'awaiting_feedback') {
        return {
          nextState: state,
          errorKey: 'feedbackExpected',
        }
      }
      const voice = {
        fileId: action.fileId,
        duration: action.duration,
      }

      if (state.existingApplicationId) {
        return {
          nextState: {
            ...state,
            voiceAttachment: voice,
            feedbackText: undefined,
            step: 'completed',
          },
          shouldUpdate: true,
        }
      }

      return {
        nextState: {
          ...state,
          voiceAttachment: voice,
          feedbackText: undefined,
          step: 'awaiting_consent',
        },
      }
    }

    case 'SKIP_FEEDBACK': {
      if (state.step !== 'awaiting_feedback') {
        return {
          nextState: state,
          errorKey: 'feedbackExpected',
        }
      }

      if (state.existingApplicationId) {
        return {
          nextState: {
            ...state,
            step: 'completed',
          },
          shouldUpdate: false,
        }
      }

      return {
        nextState: {
          ...state,
          feedbackText: undefined,
          voiceAttachment: undefined,
          step: 'awaiting_consent',
        },
      }
    }

    case 'SUBMIT_CONSENT': {
      if (state.step !== 'awaiting_consent') {
        return {
          nextState: state,
          errorKey: 'consentExpected',
        }
      }

      if (!action.agreed) {
        return {
          nextState: { ...initialSessionData },
          disagreed: true,
        }
      }

      return {
        nextState: {
          ...state,
          step: 'completed',
        },
        shouldSave: true,
      }
    }

    case 'UPDATE_FEEDBACK_START': {
      return {
        nextState: {
          ...state,
          step: 'awaiting_feedback',
        },
      }
    }

    default:
      return { nextState: state }
  }
}
