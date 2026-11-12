import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { getAuthGateway, getUserRepository } from '@/shared/api'
import { AuthContext } from './context.js'
import { useAdminClaimSync } from './useAdminClaimSync.js'
import { useUserSubscription } from './useUserSubscription.js'
import { usePendingInvite } from './usePendingInvite.js'

export const AuthProvider = ({
  children,
  gateway = getAuthGateway(),
  userRepository = getUserRepository(),
}) => {
  const [user, setUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [error, setError] = useState(null)

  const { isAdmin, setIsAdmin } = useAdminClaimSync(user, gateway)
  const { userRecord, setUserRecord, isLoadingRecord } = useUserSubscription(
    user?.id,
    userRepository
  )

  usePendingInvite(user?.id, userRecord, userRepository)

  useEffect(() => {
    let isMounted = true
    const unsubscribe = gateway.subscribeToAuthState((nextUser) => {
      if (isMounted) {
        setUser(nextUser)
        setIsLoadingAuth(false)
        if (!nextUser) {
          setIsAdmin(false)
        }
      }
    })

    return () => {
      isMounted = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [gateway, setIsAdmin])

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
    [userRepository, userRecord, setUserRecord]
  )

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

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const logout = useCallback(async () => {
    setError(null)
    try {
      await gateway.signOut()
      setUser(null)
      setUserRecord(null)
      setIsAdmin(false)
    } catch (err) {
      setError(err?.message || 'Не удалось выйти из аккаунта')
      throw err
    }
  }, [gateway, setIsAdmin, setUserRecord])

  const updateProfile = useCallback(
    async (profile) => {
      if (!user?.id) throw new Error('Не удалось определить пользователя')
      const result = await userRepository.updateProfile(user.id, profile)
      setUserRecord((current) => ({
        ...current,
        profile: { ...current?.profile, ...profile },
        updatedAt: Date.now(),
      }))
      return result
    },
    [user, userRepository, setUserRecord]
  )

  const acceptConsent = useCallback(
    async (consent) => {
      if (!user?.id) throw new Error('Не удалось определить пользователя')
      const result = await userRepository.acceptConsent(user.id, consent)
      setUserRecord((current) => ({ ...current, consent, updatedAt: Date.now() }))
      return result
    },
    [user, userRepository, setUserRecord]
  )

  const value = useMemo(() => {
    const accessStatus = isAdmin ? 'active' : userRecord?.accessStatus || 'waitlist'
    const isOnboarded = isAdmin
      ? true
      : Boolean(userRecord?.isOnboarded ?? userRecord?.profile?.displayName ?? false)

    return {
      user,
      userRecord,
      isAdmin,
      accessStatus,
      isOnboarded,
      isLoading: isLoadingAuth || isLoadingRecord,
      isLoadingAuth,
      isLoadingRecord,
      error,
      clearError,
      signInWithGoogle,
      sendEmailLink,
      signInWithEmailLink,
      redeemInvite,
      updateProfile,
      acceptConsent,
      logout,
      isAuthenticated: Boolean(user),
      isEmailLink: (href) => gateway.isEmailLink(href),
      getStoredEmailForSignIn: () => gateway.getStoredEmailForSignIn(),
    }
  }, [
      user,
      userRecord,
      isAdmin,
      isLoadingAuth,
      isLoadingRecord,
      error,
      clearError,
      signInWithGoogle,
      sendEmailLink,
      signInWithEmailLink,
      redeemInvite,
      updateProfile,
      acceptConsent,
      logout,
      gateway,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
  gateway: PropTypes.shape({
    subscribeToAuthState: PropTypes.func.isRequired,
    signInWithGoogle: PropTypes.func.isRequired,
    sendEmailLink: PropTypes.func.isRequired,
    signInWithEmailLink: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired,
    isEmailLink: PropTypes.func.isRequired,
    getStoredEmailForSignIn: PropTypes.func.isRequired,
    syncAdminClaims: PropTypes.func,
  }),
  userRepository: PropTypes.shape({
    subscribeToUser: PropTypes.func.isRequired,
    redeemInvite: PropTypes.func.isRequired,
    updateProfile: PropTypes.func.isRequired,
    acceptConsent: PropTypes.func.isRequired,
  }),
}
