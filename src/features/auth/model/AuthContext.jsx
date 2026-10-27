import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { getAuthGateway, getUserRepository, USER_STORAGE_KEYS } from '@/shared/api'
import { AuthContext } from './context.js'

export const AuthProvider = ({
  children,
  gateway = getAuthGateway(),
  userRepository = getUserRepository(),
}) => {
  const [user, setUser] = useState(null)
  const [userRecord, setUserRecord] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isLoadingRecord, setIsLoadingRecord] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    const unsubscribe = gateway.subscribeToAuthState((nextUser) => {
      if (isMounted) {
        setUser(nextUser)
        setIsLoadingAuth(false)
        if (!nextUser) {
          setUserRecord(null)
          setIsLoadingRecord(false)
        } else {
          setIsLoadingRecord(true)
        }
      }
    })

    return () => {
      isMounted = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [gateway])

  useEffect(() => {
    if (!user?.id) return

    let isMounted = true

    const unsubscribe = userRepository.subscribeToUser(
      user.id,
      (record) => {
        if (!isMounted) return
        setUserRecord(record)
        setIsLoadingRecord(false)
      },
      () => {
        if (!isMounted) return
        setIsLoadingRecord(false)
      }
    )

    return () => {
      isMounted = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [user?.id, userRepository])

  const redeemInvite = useCallback(
    async (code) => {
      setError(null)
      try {
        const result = await userRepository.redeemInvite(code)
        if (userRecord) {
          setUserRecord({
            ...userRecord,
            accessStatus: 'active',
          })
        }
        return result
      } catch (err) {
        setError(err?.message || 'Не удалось активировать приглашение')
        throw err
      }
    },
    [userRepository, userRecord]
  )

  useEffect(() => {
    if (!user?.id || !userRecord || userRecord.accessStatus !== 'waitlist') return
    if (typeof window === 'undefined' || !window.sessionStorage) return

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
  }, [user?.id, userRecord, userRepository])

  const signInWithGoogle = useCallback(async () => {
    setError(null)
    try {
      const loggedUser = await gateway.signInWithGoogle()
      setUser(loggedUser)
      return loggedUser
    } catch (err) {
      setError(err?.message || 'Не удалось войти через Google')
      throw err
    }
  }, [gateway])

  const sendEmailLink = useCallback(
    async (email, continueUrl) => {
      setError(null)
      try {
        const result = await gateway.sendEmailLink(email, continueUrl)
        return result
      } catch (err) {
        setError(err?.message || 'Не удалось отправить ссылку на почту')
        throw err
      }
    },
    [gateway]
  )

  const signInWithEmailLink = useCallback(
    async (email, href) => {
      setError(null)
      try {
        const loggedUser = await gateway.signInWithEmailLink(email, href)
        setUser(loggedUser)
        return loggedUser
      } catch (err) {
        setError(err?.message || 'Не удалось завершить вход по ссылке')
        throw err
      }
    },
    [gateway]
  )

  const logout = useCallback(async () => {
    setError(null)
    try {
      await gateway.signOut()
      setUser(null)
      setUserRecord(null)
    } catch (err) {
      setError(err?.message || 'Не удалось выйти из аккаунта')
      throw err
    }
  }, [gateway])

  const updateProfile = useCallback(
    async (profile) => {
      if (!user?.id) throw new Error('Пользователь не авторизован')
      const result = await userRepository.updateProfile(user.id, profile)
      if (userRecord) {
        setUserRecord({
          ...userRecord,
          profile: {
            ...userRecord.profile,
            ...profile,
          },
        })
      }
      return result
    },
    [user, userRecord, userRepository]
  )

  const acceptConsent = useCallback(
    async (consent) => {
      if (!user?.id) throw new Error('Пользователь не авторизован')
      const result = await userRepository.acceptConsent(user.id, consent)
      if (userRecord) {
        setUserRecord({
          ...userRecord,
          consent,
        })
      }
      return result
    },
    [user, userRecord, userRepository]
  )

  const createTelegramLinkToken = useCallback(async () => {
    return await userRepository.createTelegramLinkToken()
  }, [userRepository])

  const isEmailLink = useCallback((href) => gateway.isEmailLink(href), [gateway])

  const getStoredEmailForSignIn = useCallback(() => gateway.getStoredEmailForSignIn(), [gateway])

  const accessStatus = userRecord?.accessStatus || 'waitlist'
  const isOnboarded = Boolean(
    userRecord?.profile?.companyName &&
      userRecord?.profile?.displayName &&
      userRecord?.consent
  )
  const isOverallLoading = isLoadingAuth || (Boolean(user) && isLoadingRecord && !userRecord)

  const value = useMemo(
    () => ({
      user,
      userRecord,
      accessStatus,
      isOnboarded,
      isLoading: isOverallLoading,
      error,
      isAuthenticated: Boolean(user),
      signInWithGoogle,
      sendEmailLink,
      signInWithEmailLink,
      logout,
      isEmailLink,
      getStoredEmailForSignIn,
      redeemInvite,
      updateProfile,
      acceptConsent,
      createTelegramLinkToken,
      clearError: () => setError(null),
    }),
    [
      user,
      userRecord,
      accessStatus,
      isOnboarded,
      isOverallLoading,
      error,
      signInWithGoogle,
      sendEmailLink,
      signInWithEmailLink,
      logout,
      isEmailLink,
      getStoredEmailForSignIn,
      redeemInvite,
      updateProfile,
      acceptConsent,
      createTelegramLinkToken,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
  gateway: PropTypes.shape({
    subscribeToAuthState: PropTypes.func.isRequired,
    sendEmailLink: PropTypes.func.isRequired,
    isEmailLink: PropTypes.func.isRequired,
    signInWithEmailLink: PropTypes.func.isRequired,
    signInWithGoogle: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired,
    getStoredEmailForSignIn: PropTypes.func.isRequired,
  }),
  userRepository: PropTypes.shape({
    getUser: PropTypes.func.isRequired,
    subscribeToUser: PropTypes.func.isRequired,
    updateProfile: PropTypes.func.isRequired,
    acceptConsent: PropTypes.func.isRequired,
    redeemInvite: PropTypes.func.isRequired,
    checkInvite: PropTypes.func.isRequired,
    createTelegramLinkToken: PropTypes.func.isRequired,
  }),
}
