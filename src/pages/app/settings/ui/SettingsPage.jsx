import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import styles from './SettingsPage.module.css'

export const SettingsPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const telegramSupportUrl =
    import.meta.env.VITE_TELEGRAM_SUPPORT_URL || 'https://t.me/proofflowbot'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Настройки</h1>
        <p className={styles.subtitle}>Управление учетной записью и каналами связи</p>
      </header>

      <div className={styles.card}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Профиль</h2>

          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Электронная почта</span>
              <span className={styles.infoValue}>{user?.email || 'Не указана'}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Имя пользователя</span>
              <span className={styles.infoValue}>{user?.displayName || 'Пользователь'}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ID пользователя</span>
              <span className={styles.infoValue}>{user?.id || '—'}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Обратная связь и поддержка</h2>

          <div className={styles.supportBox}>
            <span className={styles.supportText}>
              Есть вопросы или идеи по улучшению продукта? Напишите нам в Telegram.
            </span>
            <a
              href={telegramSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.supportButton}
            >
              Написать в Telegram ↗
            </a>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Сессия</h2>
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  )
}
