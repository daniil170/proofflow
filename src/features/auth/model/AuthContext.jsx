import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { getAuthGateway } from '@/shared/api'
import { AuthContext } from './context.js'

export const AuthProvider = ({ children, gateway = getAuthGateway() }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    const unsubscribe = gateway.subscribeToAuthState((nextUser) => {
      if (isMounted) {
        setUser(nextUser)
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [gateway])

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
    } catch (err) {
      setError(err?.message || 'Не удалось выйти из аккаунта')
      throw err
    }
  }, [gateway])

  const isEmailLink = useCallback((href) => gateway.isEmailLink(href), [gateway])

  const getStoredEmailForSignIn = useCallback(() => gateway.getStoredEmailForSignIn(), [gateway])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      error,
      isAuthenticated: Boolean(user),
      signInWithGoogle,
      sendEmailLink,
      signInWithEmailLink,
      logout,
      isEmailLink,
      getStoredEmailForSignIn,
      clearError: () => setError(null),
    }),
    [
      user,
      isLoading,
      error,
      signInWithGoogle,
      sendEmailLink,
      signInWithEmailLink,
      logout,
      isEmailLink,
      getStoredEmailForSignIn,
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
}
