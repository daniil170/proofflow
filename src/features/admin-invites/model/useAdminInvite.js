import { useCallback, useState } from 'react'
import {
  getAdminInviteRepository,
  getApplicationRepository,
} from '@/shared/api'
import {
  DEFAULT_INVITE_TEMPLATE,
  formatInviteMessage,
} from '../config/inviteTemplates.js'

export const useAdminInvite = ({
  inviteRepository = getAdminInviteRepository(),
  applicationRepository = getApplicationRepository(),
} = {}) => {
  const [template, setTemplate] = useState(DEFAULT_INVITE_TEMPLATE)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)

  const copyToClipboard = useCallback(async (text, key) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
      return true
    } catch {
      return false
    }
  }, [])

  const createInvite = useCallback(
    async (applicationId) => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await inviteRepository.createInvite(applicationId)
        return res
      } catch (err) {
        setError(err?.message || 'Не удалось создать приглашение')
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [inviteRepository]
  )

  const recreateInvite = useCallback(
    async (applicationId) => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await inviteRepository.recreateInvite(applicationId)
        return res
      } catch (err) {
        setError(err?.message || 'Не удалось перевыпустить приглашение')
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [inviteRepository]
  )

  const revokeInvite = useCallback(
    async (code, reason) => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await inviteRepository.revokeInvite(code, reason)
        return res
      } catch (err) {
        setError(err?.message || 'Не удалось отозвать приглашение')
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [inviteRepository]
  )

  const markInvited = useCallback(
    async (applicationId) => {
      setIsLoading(true)
      setError(null)
      try {
        await applicationRepository.markInvited(applicationId)
      } catch (err) {
        setError(err?.message || 'Не удалось обновить статус заявки')
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [applicationRepository]
  )

  const buildInviteLink = useCallback((code) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/invite/${code}`
    }
    return `https://proofflow.ru/invite/${code}`
  }, [])

  const buildMessage = useCallback(
    (code, name = '') => {
      const link = buildInviteLink(code)
      return formatInviteMessage(template, { name, code, link })
    },
    [template, buildInviteLink]
  )

  const openMailto = useCallback(
    (email, code, name = '') => {
      const subject = encodeURIComponent('Ваш доступ к ProofFlow')
      const body = encodeURIComponent(buildMessage(code, name))
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank')
    },
    [buildMessage]
  )

  const openTelegram = useCallback(
    (username, code, name = '') => {
      const cleanUsername = username.replace(/^@/, '')
      const text = encodeURIComponent(buildMessage(code, name))
      window.open(`https://t.me/${cleanUsername}?text=${text}`, '_blank')
    },
    [buildMessage]
  )

  return {
    template,
    isLoading,
    error,
    copiedKey,
    setTemplate,
    createInvite,
    recreateInvite,
    revokeInvite,
    markInvited,
    buildInviteLink,
    buildMessage,
    copyToClipboard,
    openMailto,
    openTelegram,
  }
}
