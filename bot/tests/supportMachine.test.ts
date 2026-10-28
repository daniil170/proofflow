import { describe, expect, it } from 'vitest'
import {
  initialSupportSessionData,
  supportReducer,
} from '../src/features/support/machine.js'
import type { SupportSessionData } from '../src/features/support/types.js'

describe('supportReducer state machine', () => {
  it('transitions from idle to awaiting_topic on START', () => {
    const result = supportReducer(initialSupportSessionData, { type: 'START' })
    expect(result.nextState.step).toBe('awaiting_topic')
    expect(result.nextState.attachments).toEqual([])
  })

  it('transitions to awaiting_description on valid SELECT_TOPIC', () => {
    const startState: SupportSessionData = {
      step: 'awaiting_topic',
      attachments: [],
    }
    const result = supportReducer(startState, {
      type: 'SELECT_TOPIC',
      payload: 'Проблема в продукте',
    })
    expect(result.nextState.step).toBe('awaiting_description')
    expect(result.nextState.topic).toBe('Проблема в продукте')
  })

  it('rejects invalid topic', () => {
    const startState: SupportSessionData = {
      step: 'awaiting_topic',
      attachments: [],
    }
    const result = supportReducer(startState, {
      type: 'SELECT_TOPIC',
      payload: 'Несуществующая тема',
    })
    expect(result.nextState.step).toBe('awaiting_topic')
  })

  it('adds text content up to 2000 chars', () => {
    const startState: SupportSessionData = {
      step: 'awaiting_description',
      topic: 'Другое',
      attachments: [],
    }
    const result = supportReducer(startState, {
      type: 'ADD_CONTENT',
      payload: { text: 'Привет, не работает кнопка' },
    })
    expect(result.nextState.step).toBe('awaiting_confirmation')
    expect(result.nextState.text).toBe('Привет, не работает кнопка')
    expect(result.errorKey).toBeUndefined()
  })

  it('rejects text over 2000 chars', () => {
    const startState: SupportSessionData = {
      step: 'awaiting_description',
      topic: 'Другое',
      attachments: [],
    }
    const longText = 'a'.repeat(2001)
    const result = supportReducer(startState, {
      type: 'ADD_CONTENT',
      payload: { text: longText },
    })
    expect(result.errorKey).toBe('textTooLong')
    expect(result.nextState.step).toBe('awaiting_description')
  })

  it('adds attachments up to limit of 5', () => {
    let state: SupportSessionData = {
      step: 'awaiting_description',
      topic: 'Другое',
      attachments: [],
    }

    for (let i = 1; i <= 5; i++) {
      const res = supportReducer(state, {
        type: 'ADD_CONTENT',
        payload: {
          attachment: { fileId: `file_${i}`, type: 'photo' },
        },
      })
      expect(res.errorKey).toBeUndefined()
      state = res.nextState
    }

    expect(state.attachments.length).toBe(5)

    const overflow = supportReducer(state, {
      type: 'ADD_CONTENT',
      payload: {
        attachment: { fileId: 'file_6', type: 'photo' },
      },
    })
    expect(overflow.errorKey).toBe('tooManyAttachments')
    expect(overflow.nextState.attachments.length).toBe(5)
  })

  it('returns emptyMessage when no text or attachment provided', () => {
    const startState: SupportSessionData = {
      step: 'awaiting_description',
      topic: 'Другое',
      attachments: [],
    }
    const result = supportReducer(startState, {
      type: 'ADD_CONTENT',
      payload: { text: '   ' },
    })
    expect(result.errorKey).toBe('emptyMessage')
  })

  it('resets state on CANCEL', () => {
    const activeState: SupportSessionData = {
      step: 'awaiting_confirmation',
      topic: 'Другое',
      text: 'Тест',
      attachments: [],
    }
    const result = supportReducer(activeState, { type: 'CANCEL' })
    expect(result.nextState.step).toBe('idle')
    expect(result.nextState.topic).toBeUndefined()
  })

  it('resets state on CONFIRM', () => {
    const activeState: SupportSessionData = {
      step: 'awaiting_confirmation',
      topic: 'Другое',
      text: 'Тест',
      attachments: [],
    }
    const result = supportReducer(activeState, { type: 'CONFIRM' })
    expect(result.nextState.step).toBe('idle')
  })
})
