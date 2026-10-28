import { describe, expect, it } from 'vitest'
import {
  ideaReducer,
  initialIdeaSessionData,
  sanitizeIdeaText,
} from '../src/features/ideas/machine.js'
import type { IdeaSessionData } from '../src/features/ideas/types.js'

describe('ideaReducer state machine and sanitization', () => {
  it('sanitizes URLs so they are not clickable', () => {
    expect(sanitizeIdeaText('Check this https://example.com/test')).toBe('Check this example[.]com/test')
    expect(sanitizeIdeaText('Visit http://sub.domain.org')).toBe('Visit sub[.]domain[.]org')
    expect(sanitizeIdeaText('Open www.google.com please')).toBe('Open www[.]google[.]com please')
  })

  it('transitions from idle to awaiting_category on START', () => {
    const result = ideaReducer(initialIdeaSessionData, { type: 'START' })
    expect(result.nextState.step).toBe('awaiting_category')
  })

  it('transitions to awaiting_description on valid category', () => {
    const startState: IdeaSessionData = { step: 'awaiting_category' }
    const result = ideaReducer(startState, {
      type: 'SELECT_CATEGORY',
      payload: 'Новая функция',
    })
    expect(result.nextState.step).toBe('awaiting_description')
    expect(result.nextState.category).toBe('Новая функция')
  })

  it('rejects invalid category', () => {
    const startState: IdeaSessionData = { step: 'awaiting_category' }
    const result = ideaReducer(startState, {
      type: 'SELECT_CATEGORY',
      payload: 'Неправильная категория',
    })
    expect(result.nextState.step).toBe('awaiting_category')
  })

  it('accepts description text up to 2000 chars', () => {
    const startState: IdeaSessionData = {
      step: 'awaiting_description',
      category: 'Интеграция',
    }
    const result = ideaReducer(startState, {
      type: 'SET_DESCRIPTION',
      text: 'Интеграция с Notion',
    })
    expect(result.nextState.step).toBe('awaiting_context')
    expect(result.nextState.text).toBe('Интеграция с Notion')
    expect(result.errorKey).toBeUndefined()
  })

  it('accepts description voice message', () => {
    const startState: IdeaSessionData = {
      step: 'awaiting_description',
      category: 'Интеграция',
    }
    const result = ideaReducer(startState, {
      type: 'SET_DESCRIPTION',
      voiceFileId: 'voice_123',
    })
    expect(result.nextState.step).toBe('awaiting_context')
    expect(result.nextState.voiceFileId).toBe('voice_123')
  })

  it('rejects description longer than 2000 chars', () => {
    const startState: IdeaSessionData = {
      step: 'awaiting_description',
      category: 'Интеграция',
    }
    const result = ideaReducer(startState, {
      type: 'SET_DESCRIPTION',
      text: 'x'.repeat(2001),
    })
    expect(result.errorKey).toBe('textTooLong')
    expect(result.nextState.step).toBe('awaiting_description')
  })

  it('rejects empty description', () => {
    const startState: IdeaSessionData = {
      step: 'awaiting_description',
      category: 'Интеграция',
    }
    const result = ideaReducer(startState, {
      type: 'SET_DESCRIPTION',
      text: '   ',
    })
    expect(result.errorKey).toBe('emptyDescription')
  })

  it('sets context and resets on completion', () => {
    const startState: IdeaSessionData = {
      step: 'awaiting_context',
      category: 'Интеграция',
      text: 'Тест',
    }
    const result = ideaReducer(startState, {
      type: 'SET_CONTEXT',
      payload: 'Сейчас копируем вручную',
    })
    expect(result.nextState.step).toBe('idle')
    expect(result.nextState.context).toBe('Сейчас копируем вручную')
  })

  it('resets state on CANCEL', () => {
    const activeState: IdeaSessionData = {
      step: 'awaiting_context',
      category: 'Интеграция',
      text: 'Тест',
    }
    const result = ideaReducer(activeState, { type: 'CANCEL' })
    expect(result.nextState.step).toBe('idle')
  })
})
