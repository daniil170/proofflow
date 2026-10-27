import { describe, expect, it } from 'vitest'
import {
  normalizeTelegramUsername,
  validateConsent,
  validateContacts,
  validateEmail,
  validateHoneypot,
  validateSignupForm,
  validateTelegram,
} from '../validation.js'

describe('normalizeTelegramUsername', () => {
  it('handles empty and null values', () => {
    expect(normalizeTelegramUsername('')).toBe('')
    expect(normalizeTelegramUsername(null)).toBe('')
    expect(normalizeTelegramUsername(undefined)).toBe('')
    expect(normalizeTelegramUsername('   ')).toBe('')
  })

  it('normalizes @username prefix', () => {
    expect(normalizeTelegramUsername('@ivan_dev')).toBe('ivan_dev')
    expect(normalizeTelegramUsername('  @proofflow_lead  ')).toBe('proofflow_lead')
  })

  it('normalizes t.me/ links', () => {
    expect(normalizeTelegramUsername('t.me/ivan_dev')).toBe('ivan_dev')
    expect(normalizeTelegramUsername('https://t.me/ivan_dev')).toBe('ivan_dev')
    expect(normalizeTelegramUsername('http://t.me/ivan_dev/')).toBe('ivan_dev')
    expect(normalizeTelegramUsername('https://t.me/@ivan_dev')).toBe('ivan_dev')
  })

  it('preserves clean username unchanged', () => {
    expect(normalizeTelegramUsername('simple_user')).toBe('simple_user')
  })
})

describe('validateEmail', () => {
  it('validates correct email formats', () => {
    expect(validateEmail('test@company.ru')).toBeNull()
    expect(validateEmail('hello.world+tag@agency.com')).toBeNull()
  })

  it('fails on invalid email formats', () => {
    expect(validateEmail('not-an-email')).toBe(
      'Проверьте формат почты (например, you@company.ru)'
    )
    expect(validateEmail('user@domain')).toBe(
      'Проверьте формат почты (например, you@company.ru)'
    )
  })

  it('handles optional mode', () => {
    expect(validateEmail('', true)).toBeNull()
    expect(validateEmail('   ', true)).toBeNull()
    expect(validateEmail('', false)).toBe('Укажите рабочую почту')
  })
})

describe('validateTelegram', () => {
  it('accepts valid usernames or links', () => {
    expect(validateTelegram('@ivan_dev')).toBeNull()
    expect(validateTelegram('ivan_dev')).toBeNull()
    expect(validateTelegram('https://t.me/alex_marketing')).toBeNull()
  })

  it('returns null when empty (optional field)', () => {
    expect(validateTelegram('')).toBeNull()
    expect(validateTelegram(null)).toBeNull()
  })

  it('fails when username has invalid characters or too short', () => {
    expect(validateTelegram('a')).toBe(
      'Проверьте username в Telegram (например, @username или t.me/username)'
    )
    expect(validateTelegram('user with spaces')).toBe(
      'Проверьте username в Telegram (например, @username или t.me/username)'
    )
    expect(validateTelegram('@bad$symbol')).toBe(
      'Проверьте username в Telegram (например, @username или t.me/username)'
    )
  })
})

describe('validateContacts', () => {
  it('fails when neither email nor telegram is provided', () => {
    expect(validateContacts('', '')).toBe(
      'Укажите хотя бы один способ связи: почту или Telegram'
    )
    expect(validateContacts('   ', '   ')).toBe(
      'Укажите хотя бы один способ связи: почту или Telegram'
    )
  })

  it('succeeds when email only is provided', () => {
    expect(validateContacts('user@agency.ru', '')).toBeNull()
  })

  it('succeeds when telegram only is provided', () => {
    expect(validateContacts('', '@marketing_lead')).toBeNull()
  })

  it('succeeds when both are provided', () => {
    expect(validateContacts('user@agency.ru', '@marketing_lead')).toBeNull()
  })
})

describe('validateConsent and validateHoneypot', () => {
  it('validates consent requirement', () => {
    expect(validateConsent(true)).toBeNull()
    expect(validateConsent(false)).toBe(
      'Необходимо согласие на обработку контактных данных'
    )
  })

  it('detects honeypot bots', () => {
    expect(validateHoneypot('')).toBeNull()
    expect(validateHoneypot('bot-fill')).toBe(
      'Обнаружена автоматическая отправка'
    )
  })
})

describe('validateSignupForm', () => {
  it('succeeds with valid email only and consent', () => {
    const result = validateSignupForm({
      email: 'founder@studio.io',
      telegramUsername: '',
      consent: true,
      websiteHoneypot: '',
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('succeeds with valid telegram only and consent', () => {
    const result = validateSignupForm({
      email: '',
      telegramUsername: 'https://t.me/founder_alex',
      consent: true,
      websiteHoneypot: '',
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('succeeds with both email and telegram', () => {
    const result = validateSignupForm({
      email: 'founder@studio.io',
      telegramUsername: '@founder_alex',
      consent: true,
      websiteHoneypot: '',
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('fails with contact error when both contacts missing', () => {
    const result = validateSignupForm({
      email: '',
      telegramUsername: '',
      consent: true,
      websiteHoneypot: '',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.email).toBe(
      'Укажите хотя бы один способ связи: почту или Telegram'
    )
  })

  it('validates format when email is malformed', () => {
    const result = validateSignupForm({
      email: 'bad-email',
      telegramUsername: '@alex',
      consent: true,
      websiteHoneypot: '',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.email).toBe(
      'Проверьте формат почты (например, you@company.ru)'
    )
  })

  it('validates format when telegram is malformed', () => {
    const result = validateSignupForm({
      email: 'alex@company.ru',
      telegramUsername: 'bad user!',
      consent: true,
      websiteHoneypot: '',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.telegramUsername).toBe(
      'Проверьте username в Telegram (например, @username или t.me/username)'
    )
  })

  it('fails when consent is false', () => {
    const result = validateSignupForm({
      email: 'alex@company.ru',
      telegramUsername: '',
      consent: false,
      websiteHoneypot: '',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.consent).toBe(
      'Необходимо согласие на обработку контактных данных'
    )
  })

  it('flags honeypot error', () => {
    const result = validateSignupForm({
      email: 'alex@company.ru',
      telegramUsername: '',
      consent: true,
      websiteHoneypot: 'spam-bot-value',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.honeypot).toBe('Обнаружена автоматическая отправка')
  })
})
