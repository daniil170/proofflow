import { useAuth } from '../model/useAuth.js'
import styles from './BlockedScreen.module.css'

export const BlockedScreen = () => {
  const { logout } = useAuth()
  const telegramSupportUrl =
    import.meta.env.VITE_TELEGRAM_SUPPORT_URL || 'https://t.me/proofflowbot'

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Доступ к платформе ограничен</h1>
        <p className={styles.description}>
          Ваш аккаунт был временно заблокирован. Если вы считаете, что это произошло
          по ошибке, свяжитесь с нашей командой поддержки.
        </p>

        <a
          href={telegramSupportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.contactBtn}
        >
          Связаться с поддержкой ↗
        </a>

        <div className={styles.footer}>
          <button type="button" onClick={logout} className={styles.logoutBtn}>
            Выйти из учетной записи
          </button>
        </div>
      </div>
    </div>
  )
}
