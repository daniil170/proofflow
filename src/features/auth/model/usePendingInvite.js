import { useEffect } from 'react'
import { USER_STORAGE_KEYS } from '@/shared/api'

export const usePendingInvite = (userId, userRecord, userRepository) => {
  useEffect(() => {
    if (!userId || !userRecord || userRecord.accessStatus !== 'waitlist') return undefined
    if (typeof window === 'undefined' || !window.sessionStorage) return undefined

    const pendingCode =
      window.sessionStorage.getItem(USER_STORAGE_KEYS.PENDING_INVITE) ||
      window.localStorage?.getItem(USER_STORAGE_KEYS.PENDING_INVITE)

    if (pendingCode) {
      window.sessionStorage.removeItem(USER_STORAGE_KEYS.PENDING_INVITE)
      window.localStorage?.removeItem(USER_STORAGE_KEYS.PENDING_INVITE)
      const timer = setTimeout(() => {
        userRepository.redeemInvite(pendingCode).catch(() => {})
      }, 0)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [userId, userRecord, userRepository])
}
