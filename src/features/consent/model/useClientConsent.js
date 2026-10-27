import { useState, useCallback } from 'react'
import { getConsentGateway, getCaseRepository } from '@/shared/api'

export const useClientConsent = ({
  caseItem,
  onConsentUpdated = null,
  gateway = getConsentGateway(),
  repository = getCaseRepository(),
} = {}) => {
  const [consentUrl, setConsentUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const createConsentLink = useCallback(async () => {
    if (!caseItem?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await gateway.createConsentRequest(caseItem.id)
      setConsentUrl(res.url)
      if (typeof onConsentUpdated === 'function') {
        onConsentUpdated({ clientConsentStatus: 'pending' })
      }
    } catch (err) {
      setError(err?.message || 'Не удалось создать ссылку на согласие')
    } finally {
      setIsLoading(false)
    }
  }, [caseItem, gateway, onConsentUpdated])

  const confirmDirectConsent = useCallback(async () => {
    if (!caseItem?.id) return
    setIsLoading(true)
    setError(null)
    try {
      await repository.update(caseItem.id, {
        consentConfirmed: true,
        clientConsentStatus: 'approved',
      })
      if (typeof onConsentUpdated === 'function') {
        onConsentUpdated({ consentConfirmed: true, clientConsentStatus: 'approved' })
      }
    } catch (err) {
      setError(err?.message || 'Не удалось сохранить согласие')
    } finally {
      setIsLoading(false)
    }
  }, [caseItem, repository, onConsentUpdated])

  const copyConsentLink = useCallback(async () => {
    if (!consentUrl) return
    try {
      await navigator.clipboard.writeText(consentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [consentUrl])

  return {
    consentUrl,
    isLoading,
    error,
    copied,
    createConsentLink,
    confirmDirectConsent,
    copyConsentLink,
  }
}
