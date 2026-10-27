const EMAIL_REGEXP =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

const TELEGRAM_USERNAME_REGEXP = /^[a-zA-Z0-9_]{3,32}$/

export const normalizeTelegramUsername = (raw) => {
  if (!raw) return ''
  let cleaned = String(raw).trim()
  cleaned = cleaned.replace(/^https?:\/\//i, '')
  cleaned = cleaned.replace(/^t\.me\//i, '')
  cleaned = cleaned.replace(/^@/, '')
  cleaned = cleaned.replace(/\/+$/, '')
  return cleaned
}

export const validateEmail = (email, isOptional = false) => {
  const trimmed = (email || '').trim()

  if (!trimmed) {
    return isOptional ? null : 'Укажите рабочую почту'
  }

  if (!EMAIL_REGEXP.test(trimmed)) {
    return 'Проверьте формат почты (например, you@company.ru)'
  }

  return null
}

export const validateTelegram = (telegramUsername) => {
  const trimmed = (telegramUsername || '').trim()
  if (!trimmed) return null

  const normalized = normalizeTelegramUsername(trimmed)
  if (!normalized || !TELEGRAM_USERNAME_REGEXP.test(normalized)) {
    return 'Проверьте username в Telegram (например, @username или t.me/username)'
  }

  return null
}

export const validateContacts = (email, telegramUsername) => {
  const trimmedEmail = (email || '').trim()
  const normalizedTg = normalizeTelegramUsername(telegramUsername)

  if (!trimmedEmail && !normalizedTg) {
    return 'Укажите хотя бы один способ связи: почту или Telegram'
  }

  return null
}

export const validateConsent = (consent) => {
  if (!consent) {
    return 'Необходимо согласие на обработку контактных данных'
  }

  return null
}

export const validateHoneypot = (honeypot) => {
  if (honeypot && honeypot.trim().length > 0) {
    return 'Обнаружена автоматическая отправка'
  }

  return null
}

export const validateSignupForm = ({ email, telegramUsername, consent, websiteHoneypot }) => {
  const errors = {}

  const contactError = validateContacts(email, telegramUsername)
  if (contactError) {
    errors.contact = contactError
    errors.email = contactError
  } else {
    const emailError = validateEmail(email, true)
    if (emailError) {
      errors.email = emailError
    }
    const telegramError = validateTelegram(telegramUsername)
    if (telegramError) {
      errors.telegramUsername = telegramError
    }
  }

  const consentError = validateConsent(consent)
  if (consentError) {
    errors.consent = consentError
  }

  const honeypotError = validateHoneypot(websiteHoneypot)
  if (honeypotError) {
    errors.honeypot = honeypotError
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
