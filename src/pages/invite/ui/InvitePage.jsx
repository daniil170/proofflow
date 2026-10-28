import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LoginForm, useAuth } from '@/features/auth'
import { getUserRepository, USER_STORAGE_KEYS } from '@/shared/api'
import { Button } from '@/shared/ui'
import styles from './InvitePage.module.css'

export const InvitePage = () => {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, redeemInvite } = useAuth()
  const userRepository = getUserRepository()

  const [isLoading, setIsLoading] = useState(true)
  const [inviteStatus, setInviteStatus] = useState(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    if (code && typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(USER_STORAGE_KEYS.PENDING_INVITE, code.trim())
      window.localStorage?.setItem(USER_STORAGE_KEYS.PENDING_INVITE, code.trim())
    }

    const verify = async () => {
      try {
        const response = await userRepository.checkInvite(code)
        if (isMounted) {
          setInviteStatus(response)
          setIsLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setInviteStatus({
            valid: false,
            status: 'not_found',
            message: err?.message || 'Не удалось проверить приглашение',
          })
          setIsLoading(false)
        }
      }
    }

    verify()

    return () => {
      isMounted = false
    }
  }, [code, userRepository])

  const handleRedeemAndProceed = async () => {
    setIsRedeeming(true)
    setErrorMessage('')
    try {
      await redeemInvite(code.trim())
      navigate('/app/welcome')
    } catch (err) {
      setErrorMessage(err?.message || 'Не удалось активировать приглашение')
      setIsRedeeming(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loadingBox}>
            <div className={styles.spinner} role="status" aria-label="Проверка" />
            <span className={styles.description}>Проверка приглашения...</span>
          </div>
        </div>
      </div>
    )
  }

  const isInvalid = !inviteStatus?.valid

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            <div className={styles.logoGlow} />
            <svg
              className={styles.animatedLogo}
              viewBox="0 0 100 100"
              width="64"
              height="64"
              role="img"
              aria-label="ProofFlow Logo"
            >
              <rect width="100" height="100" rx="22" fill="#0b0f19" className={styles.logoBg} />
              <g transform="translate(50 50) scale(0.62) translate(-50 -50)">
                <g fill="none" strokeWidth="12" strokeLinecap="round">
                  <path
                    d="M35 84V30A14 14 0 0 1 49 16M59 84V30A14 14 0 0 1 73 16"
                    stroke="#ffffff"
                    className={styles.logoPipes}
                  />
                  <path d="M21 44H79" stroke="#d4ff3a" className={styles.logoFlowBar} />
                </g>
              </g>
            </svg>
          </div>
          <span className={isInvalid ? styles.badgeError : styles.badge}>
            {isInvalid ? 'Ошибка доступа' : 'Приглашение в ProofFlow'}
          </span>
          <h1 className={styles.title}>
            {isInvalid ? 'Недействительное приглашение' : 'Добро пожаловать в бета-тест'}
          </h1>
          <p className={styles.description}>
            {inviteStatus?.status === 'expired' &&
              'Срок действия этого приглашения истёк. Запросите новый инвайт или оставьте заявку на главной.'}
            {inviteStatus?.status === 'used' &&
              'Это приглашение уже было использовано. Каждый код является одноразовым.'}
            {inviteStatus?.status === 'revoked' &&
              'Это приглашение было отозвано администратором.'}
            {inviteStatus?.status === 'not_found' &&
              'Код приглашения не найден. Проверьте правильность адреса ссылки.'}
            {inviteStatus?.valid &&
              'Вы получили персональное приглашение для доступа к закрытой версии платформы генерации кейсов.'}
          </p>
        </div>

        <div className={styles.codeBox}>
          <span className={styles.codeLabel}>Код приглашения:</span>
          <span className={styles.codeValue}>{code.trim().toUpperCase()}</span>
        </div>

        {errorMessage && (
          <div className={styles.description} style={{ color: 'var(--color-error)' }}>
            {errorMessage}
          </div>
        )}

        <div className={styles.actionSection}>
          {inviteStatus?.valid ? (
            isAuthenticated ? (
              <Button
                variant="primary"
                size="large"
                disabled={isRedeeming}
                onClick={handleRedeemAndProceed}
                className={styles.btn}
              >
                {isRedeeming ? 'Активация...' : 'Активировать и продолжить'}
              </Button>
            ) : (
              <LoginForm onSuccess={handleRedeemAndProceed} />
            )
          ) : (
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="large" className={styles.btnSecondary}>
                На главную страницу
              </Button>
            </Link>
          )}
        </div>

        <div className={styles.footer}>
          <Link to="/" className={styles.link}>
            ← Вернуться на ProofFlow
          </Link>
        </div>
      </div>
    </div>
  )
}
