import { useCallback, useState } from 'react'
import { getBetaSignupGateway, SIGNUP_STATUS } from '@/shared/api'
import { validateSignupForm } from './validation.js'

const INITIAL_FORM_DATA = Object.freeze({
  email: '',
  businessType: 'agency_or_studio',
  casesVolume: '1_to_3',
  currentProcess: '',
  consent: false,
  websiteHoneypot: '',
})

export const useBetaSignup = (customGateway = null) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [status, setStatus] = useState(SIGNUP_STATUS.IDLE)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)

  const updateField = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
    setServerError(null)
  }, [])

  const submit = useCallback(
    async (event) => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault()
      }

      if (status === SIGNUP_STATUS.LOADING) {
        return
      }

      const { isValid, errors: validationErrors } = validateSignupForm(formData)

      if (!isValid) {
        if (validationErrors.honeypot) {
          setStatus(SIGNUP_STATUS.SUCCESS)
          return
        }
        setErrors(validationErrors)
        return
      }

      setStatus(SIGNUP_STATUS.LOADING)
      setServerError(null)

      const gateway = customGateway || getBetaSignupGateway()

      try {
        const payload = {
          email: formData.email.trim(),
          businessType: formData.businessType,
          casesVolume: formData.casesVolume,
          currentProcess: formData.currentProcess.trim(),
          consent: formData.consent,
        }

        await gateway.submit(payload)
        setStatus(SIGNUP_STATUS.SUCCESS)
      } catch {
        setStatus(SIGNUP_STATUS.ERROR)
        setServerError(
          'Не удалось отправить заявку. Пожалуйста, попробуйте снова или напишите нам в Telegram.'
        )
      }
    },
    [customGateway, formData, status]
  )

  const reset = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
    setStatus(SIGNUP_STATUS.IDLE)
    setErrors({})
    setServerError(null)
  }, [])

  return {
    formData,
    status,
    errors,
    serverError,
    isLoading: status === SIGNUP_STATUS.LOADING,
    isSuccess: status === SIGNUP_STATUS.SUCCESS,
    updateField,
    submit,
    reset,
  }
}
