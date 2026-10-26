import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../model/useAuth.js'
import styles from './LoginForm.module.css'

export const LoginForm = ({ onSuccess }) => {
  const {
    signInWithGoogle,
    sendEmailLink,
    signInWithEmailLink,
    isEmailLink,
    getStoredEmailForSignIn,
    error: authError,
    clearError,
  } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)

  const [isCompletingEmailLink, setIsCompletingEmailLink] = useState(() => {
    if (typeof window === 'undefined') return false
    return isEmailLink(window.location.href) && Boolean(getStoredEmailForSignIn())
  })
  const [needsEmailConfirmation] = useState(() => {
    if (typeof window === 'undefined') return false
    return isEmailLink(window.location.href) && !getStoredEmailForSignIn()
  })

  const redirectTarget = location.state?.from?.pathname || '/app'

  const handleCompleteSuccess = useCallback(() => {
    if (onSuccess) {
      onSuccess()
    } else {
      navigate(redirectTarget, { replace: true })
    }
  }, [navigate, onSuccess, redirectTarget])

  useEffect(() => {
    const href = window.location.href
    if (isEmailLink(href)) {
      const storedEmail = getStoredEmailForSignIn()
      if (storedEmail) {
        signInWithEmailLink(storedEmail, href)
          .then(() => {
            handleCompleteSuccess()
          })
          .catch((err) => {
            setLocalError(err?.message || 'Не удалось завершить вход по ссылке')
            setIsCompletingEmailLink(false)
          })
      }
    }
  }, [isEmailLink, getStoredEmailForSignIn, signInWithEmailLink, handleCompleteSuccess])

  const handleGoogleSignIn = async () => {
    clearError()
    setLocalError('')
    setIsSubmitting(true)
    try {
      await signInWithGoogle()
      handleCompleteSuccess()
    } catch (err) {
      setLocalError(err?.message || 'Ошибка входа через Google')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendEmailLink = async (e) => {
    e.preventDefault()
    clearError()
    setLocalError('')

    const cleanEmail = email.trim()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLocalError('Пожалуйста, введите корректный адрес электронной почты')
      return
    }

    setIsSubmitting(true)
    try {
      const continueUrl = `${window.location.origin}/login`
      await sendEmailLink(cleanEmail, continueUrl)
      setIsEmailSent(true)
    } catch (err) {
      setLocalError(err?.message || 'Не удалось отправить ссылку. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmEmailLink = async (e) => {
    e.preventDefault()
    clearError()
    setLocalError('')

    const cleanEmail = email.trim()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLocalError('Пожалуйста, укажите email, на который запрашивали ссылку')
      return
    }

    setIsSubmitting(true)
    try {
      await signInWithEmailLink(cleanEmail, window.location.href)
      handleCompleteSuccess()
    } catch (err) {
      setLocalError(err?.message || 'Неверная или устаревшая ссылка')
    } finally {
      setIsSubmitting(false)
    }
  }

  const errorMessage = localError || authError

  if (isCompletingEmailLink) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Вход в систему</h2>
          <p className={styles.subtitle}>Проверяем ссылку из письма и выполняем вход...</p>
        </div>
      </div>
    )
  }

  if (needsEmailConfirmation) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Подтверждение email</h2>
          <p className={styles.subtitle}>
            Введите ваш email адрес для подтверждения входа по ссылке
          </p>
        </div>

        {errorMessage && <div className={styles.alertError}>{errorMessage}</div>}

        <form onSubmit={handleConfirmEmailLink} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="confirm-email" className={styles.label}>
              Электронная почта
            </label>
            <input
              id="confirm-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className={styles.input}
              disabled={isSubmitting}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
            {isSubmitting ? 'Подтверждение...' : 'Войти в аккаунт'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Вход в ProofFlow</h2>
        <p className={styles.subtitle}>
          Авторизация без паролей — через Google или одноразовую ссылку на почту
        </p>
      </div>

      {errorMessage && <div className={styles.alertError}>{errorMessage}</div>}

      {isEmailSent ? (
        <div className={styles.successBox}>
          <div className={styles.successIcon}>✓</div>
          <h3 className={styles.successTitle}>Ссылка отправлена</h3>
          <p className={styles.successDescription}>
            Мы отправили ссылку для быстрого входа на{' '}
            <span className={styles.successEmail}>{email}</span>. Перейдите по ней из письма.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsEmailSent(false)
              setLocalError('')
            }}
            className={styles.resetButton}
          >
            Указать другой адрес
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className={styles.googleButton}
          >
            <svg
              className={styles.googleIcon}
              viewBox="0 0 24 24"
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            Продолжить через Google
          </button>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>или</span>
            <span className={styles.dividerLine} />
          </div>

          <form onSubmit={handleSendEmailLink} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="login-email" className={styles.label}>
                Электронная почта
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
              {isSubmitting ? 'Отправляем...' : 'Получить ссылку для входа'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

LoginForm.propTypes = {
  onSuccess: PropTypes.func,
}
