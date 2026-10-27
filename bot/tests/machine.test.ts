import { describe, expect, it } from 'vitest'
import { initialSessionData, signupReducer } from '../src/features/signup/machine.js'
import type { SignupSessionData } from '../src/features/signup/types.js'

describe('signupReducer state machine', () => {
  it('handles standard successful flow with text feedback', () => {
    let state: SignupSessionData = { ...initialSessionData }

    const step1 = signupReducer(state, { type: 'START', deepLink: 'landing' })
    expect(step1.nextState.step).toBe('awaiting_business_type')
    expect(step1.nextState.deepLink).toBe('landing')
    state = step1.nextState

    const step2 = signupReducer(state, {
      type: 'SELECT_BUSINESS_TYPE',
      payload: 'Веб-студия',
    })
    expect(step2.nextState.step).toBe('awaiting_cases_volume')
    expect(step2.nextState.businessType).toBe('Веб-студия')
    state = step2.nextState

    const step3 = signupReducer(state, {
      type: 'SELECT_CASES_VOLUME',
      payload: '4-10',
    })
    expect(step3.nextState.step).toBe('awaiting_feedback')
    expect(step3.nextState.casesVolume).toBe('4-10')
    state = step3.nextState

    const step4 = signupReducer(state, {
      type: 'SUBMIT_FEEDBACK_TEXT',
      payload: 'Пишем вручную в Google Docs, уходит по 3 дня на кейс',
    })
    expect(step4.nextState.step).toBe('awaiting_consent')
    expect(step4.nextState.feedbackText).toBe(
      'Пишем вручную в Google Docs, уходит по 3 дня на кейс'
    )
    state = step4.nextState

    const step5 = signupReducer(state, {
      type: 'SUBMIT_CONSENT',
      agreed: true,
    })
    expect(step5.nextState.step).toBe('completed')
    expect(step5.shouldSave).toBe(true)
  })

  it('handles voice message feedback', () => {
    let state: SignupSessionData = {
      step: 'awaiting_feedback',
      businessType: 'IT-аутсорс',
      casesVolume: '1-3',
    }

    const stepVoice = signupReducer(state, {
      type: 'SUBMIT_FEEDBACK_VOICE',
      fileId: 'voice_abc_123',
      duration: 42,
    })

    expect(stepVoice.nextState.step).toBe('awaiting_consent')
    expect(stepVoice.nextState.voiceAttachment).toEqual({
      fileId: 'voice_abc_123',
      duration: 42,
    })
    expect(stepVoice.nextState.feedbackText).toBeUndefined()
    state = stepVoice.nextState

    const consent = signupReducer(state, {
      type: 'SUBMIT_CONSENT',
      agreed: true,
    })
    expect(consent.shouldSave).toBe(true)
    expect(consent.nextState.step).toBe('completed')
  })

  it('handles skipping feedback', () => {
    const state: SignupSessionData = {
      step: 'awaiting_feedback',
      businessType: 'Фрилансер',
      casesVolume: '1-3',
    }

    const res = signupReducer(state, { type: 'SKIP_FEEDBACK' })
    expect(res.nextState.step).toBe('awaiting_consent')
    expect(res.nextState.feedbackText).toBeUndefined()
    expect(res.nextState.voiceAttachment).toBeUndefined()
  })

  it('handles consent disagreement by resetting and not saving', () => {
    const state: SignupSessionData = {
      step: 'awaiting_consent',
      businessType: 'Консалтинг',
      casesVolume: '1-3',
      feedbackText: 'Some text',
    }

    const res = signupReducer(state, {
      type: 'SUBMIT_CONSENT',
      agreed: false,
    })
    expect(res.disagreed).toBe(true)
    expect(res.shouldSave).toBeFalsy()
    expect(res.nextState.step).toBe('idle')
  })

  it('rejects invalid business type', () => {
    const state: SignupSessionData = { step: 'awaiting_business_type' }
    const res = signupReducer(state, {
      type: 'SELECT_BUSINESS_TYPE',
      payload: 'Несуществующий тип',
    })
    expect(res.errorKey).toBe('selectButton')
    expect(res.nextState.step).toBe('awaiting_business_type')
  })

  it('rejects invalid cases volume', () => {
    const state: SignupSessionData = { step: 'awaiting_cases_volume' }
    const res = signupReducer(state, {
      type: 'SELECT_CASES_VOLUME',
      payload: '100500',
    })
    expect(res.errorKey).toBe('selectButton')
    expect(res.nextState.step).toBe('awaiting_cases_volume')
  })

  it('rejects empty feedback text', () => {
    const state: SignupSessionData = { step: 'awaiting_feedback' }
    const res = signupReducer(state, {
      type: 'SUBMIT_FEEDBACK_TEXT',
      payload: '   ',
    })
    expect(res.errorKey).toBe('feedbackExpected')
    expect(res.nextState.step).toBe('awaiting_feedback')
  })

  it('handles updating feedback for existing application', () => {
    let state: SignupSessionData = {
      step: 'idle',
      existingApplicationId: 'app_123',
    }

    const startUpdate = signupReducer(state, { type: 'UPDATE_FEEDBACK_START' })
    expect(startUpdate.nextState.step).toBe('awaiting_feedback')
    state = startUpdate.nextState

    const submitUpdate = signupReducer(state, {
      type: 'SUBMIT_FEEDBACK_TEXT',
      payload: 'Дополнительное примечание',
    })
    expect(submitUpdate.shouldUpdate).toBe(true)
    expect(submitUpdate.nextState.step).toBe('completed')
    expect(submitUpdate.nextState.feedbackText).toBe('Дополнительное примечание')
  })

  it('handles reset action', () => {
    const state: SignupSessionData = {
      step: 'awaiting_consent',
      businessType: 'Веб-студия',
    }
    const res = signupReducer(state, { type: 'RESET' })
    expect(res.nextState.step).toBe('idle')
    expect(res.nextState.businessType).toBeUndefined()
  })

  it('handles account linking state machine transitions', () => {
    const initial: SignupSessionData = { step: 'idle' }

    const linkingStep = signupReducer(initial, {
      type: 'START_LINK',
      token: 'tok_abc123',
    })
    expect(linkingStep.nextState.step).toBe('account_linking')
    expect(linkingStep.nextState.linkToken).toBe('tok_abc123')

    const successStep = signupReducer(linkingStep.nextState, {
      type: 'LINK_SUCCESS',
      uid: 'user_456',
    })
    expect(successStep.nextState.step).toBe('linked')
    expect(successStep.nextState.linkedUserId).toBe('user_456')
    expect(successStep.nextState.linkError).toBeUndefined()

    const failedStep = signupReducer(linkingStep.nextState, {
      type: 'LINK_FAILED',
      error: 'expired_token',
    })
    expect(failedStep.nextState.step).toBe('idle')
    expect(failedStep.nextState.linkError).toBe('expired_token')
  })
})
