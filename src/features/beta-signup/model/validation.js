const EMAIL_REGEXP =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export const validateEmail = (email) => {
  const trimmed = (email || '').trim()

  if (!trimmed) {
    return 'Укажите рабочую почту'
  }

  if (!EMAIL_REGEXP.test(trimmed)) {
    return 'Проверьте формат почты (например, you@company.ru)'
  }

  return null
}

export const validateConsent = (consent) => {
  if (!consent) {
    return 'Необходимо согласие на обработку почты'
  }

  return null
}

export const validateHoneypot = (honeypot) => {
  if (honeypot && honeypot.trim().length > 0) {
    return 'Обнаружена автоматическая отправка'
  }

  return null
}

export const validateSignupForm = ({ email, consent, websiteHoneypot }) => {
  const errors = {}

  const emailError = validateEmail(email)
  if (emailError) {
    errors.email = emailError
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
