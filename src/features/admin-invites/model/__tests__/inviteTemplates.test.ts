import { describe, expect, it } from 'vitest'
import {
  DEFAULT_INVITE_TEMPLATE,
  formatInviteMessage,
} from '../../config/inviteTemplates'

describe('inviteTemplates', () => {
  it('formats template replacing placeholders', () => {
    const formatted = formatInviteMessage(
      'Привет, {name}! Твой код: {code}, ссылка: {link}',
      {
        name: 'Даниил',
        code: 'PF-289A-BC',
        link: 'https://proofflow.ru/invite/PF-289A-BC',
      }
    )

    expect(formatted).toBe(
      'Привет, Даниил! Твой код: PF-289A-BC, ссылка: https://proofflow.ru/invite/PF-289A-BC'
    )
  })

  it('handles fallback name when name is missing', () => {
    const formatted = formatInviteMessage('Привет, {name}!', {
      code: 'PF-289A-BC',
      link: 'https://proofflow.ru/invite/PF-289A-BC',
    })

    expect(formatted).toBe('Привет, друг!')
  })

  it('contains essential placeholders in DEFAULT_INVITE_TEMPLATE', () => {
    expect(DEFAULT_INVITE_TEMPLATE).toContain('{namePrefix}')
    expect(DEFAULT_INVITE_TEMPLATE).toContain('{code}')
    expect(DEFAULT_INVITE_TEMPLATE).toContain('{link}')
  })
})
