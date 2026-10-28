import { useState } from 'react'
import PropTypes from 'prop-types'
import { useAuth } from '../model/useAuth.js'
import styles from './WaitlistScreen.module.css'

export const WaitlistScreen = ({ onActivated }) => {
  const { logout, redeemInvite } = useAuth()
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const telegramChannelUrl =
    import.meta.env.VITE_TELEGRAM_CHANNEL_URL ||
    import.meta.env.VITE_TELEGRAM_SUPPORT_URL ||
    'https://t.me/proofflowbot'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      setErrorMessage('Введите код приглашения')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await redeemInvite(code.trim())
      if (typeof onActivated === 'function') {
        onActivated()
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Не удалось активировать приглашение')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            <div className={styles.logoGlow} />
            <svg
              className={styles.animatedLogo}
              viewBox="0 0 100 100"
              width="60"
              height="60"
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
          <span className={styles.badge}>Закрытый доступ</span>
          <h1 className={styles.title}>Вы в списке ожидания</h1>
          <p className={styles.description}>
            Мы подключаем команды партиями, чтобы обеспечить надежность платформы и помочь
            с первыми кейсами. Напишем вам, когда откроем доступ.
          </p>
        </div>

        <div className={styles.telegramBox}>
          <span className={styles.telegramText}>
            Следите за новостями и анонсами запусков:
          </span>
          <a
            href={telegramChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.telegramLink}
          >
            Telegram-канал ↗
          </a>
        </div>

        <div className={styles.redeemSection}>
          <h2 className={styles.sectionLabel}>У меня есть инвайт-код</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputRow}>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  if (errorMessage) setErrorMessage('')
                }}
                placeholder="Например, BETA2026"
                disabled={isSubmitting}
                className={styles.input}
              />
              <button
                type="submit"
                disabled={isSubmitting || !code.trim()}
                className={styles.submitBtn}
              >
                {isSubmitting ? 'Активация...' : 'Активировать'}
              </button>
            </div>
            {errorMessage && <p className={styles.error}>{errorMessage}</p>}
          </form>
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={logout} className={styles.logoutBtn}>
            Выйти из учетной записи
          </button>
        </div>
      </div>
    </div>
  )
}

WaitlistScreen.propTypes = {
  onActivated: PropTypes.func,
}
