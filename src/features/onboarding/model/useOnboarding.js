import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { userProfileSchema } from '@/entities/user'

const DOCUMENT_VERSION = '2026-10-v1'

export const normalizeUrl = (value) => {
  const trimmed = (value || '').trim()
  if (!trimmed) return ''
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`
  }
  return trimmed
}

export const isValidUrl = (value) => {
  const trimmed = (value || '').trim()
  if (!trimmed) return true
  try {
    const parsed = new URL(normalizeUrl(trimmed))
    return Boolean(parsed.hostname && parsed.hostname.includes('.'))
  } catch {
    return false
  }
}

export const useOnboarding = (onSuccess) => {
  const { user, userRecord, updateProfile, acceptConsent } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    displayName: userRecord?.profile?.displayName || user?.displayName || '',
    companyName: userRecord?.profile?.companyName || '',
    businessType: userRecord?.profile?.businessType || 'agency_or_studio',
    websiteUrl: userRecord?.profile?.websiteUrl || '',
    currentProcessNote: userRecord?.profile?.currentProcessNote || '',
    consent: Boolean(userRecord?.consent),
  })

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (serverError) {
      setServerError('')
    }
  }

  const validate = () => {
    const nextErrors = {}

    if (!formData.displayName.trim()) {
      nextErrors.displayName = 'Укажите ваше имя'
    }

    if (!formData.companyName.trim()) {
      nextErrors.companyName = 'Укажите название компании или проекта'
    }

    if (!formData.businessType) {
      nextErrors.businessType = 'Выберите сферу деятельности'
    }

    if (formData.websiteUrl.trim() && !isValidUrl(formData.websiteUrl)) {
      nextErrors.websiteUrl = 'Введите корректный адрес сайта (например, https://studio.ru)'
    }

    if (!formData.consent) {
      nextErrors.consent = 'Необходимо принять условия использования и политику обработки данных'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    setServerError('')

    try {
      const normalizedWebsite = normalizeUrl(formData.websiteUrl)

      const profilePayload = {
        displayName: formData.displayName.trim(),
        companyName: formData.companyName.trim(),
        businessType: formData.businessType,
        websiteUrl: normalizedWebsite,
        currentProcessNote: formData.currentProcessNote.trim(),
        logoPath: userRecord?.profile?.logoPath || null,
      }

      userProfileSchema.parse(profilePayload)

      await updateProfile(profilePayload)
      await acceptConsent({
        documentVersion: DOCUMENT_VERSION,
        acceptedAt: Date.now(),
      })

      if (typeof onSuccess === 'function') {
        onSuccess()
      } else {
        navigate('/app')
      }
    } catch (err) {
      setServerError(err?.message || 'Не удалось сохранить профиль. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    errors,
    serverError,
    isSubmitting,
    updateField,
    submit,
  }
}
