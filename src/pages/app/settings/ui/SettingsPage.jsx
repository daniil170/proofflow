import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import styles from './SettingsPage.module.css'

export const SettingsPage = () => {
  const { user, userRecord, logout, createTelegramLinkToken } = useAuth()
  const navigate = useNavigate()

  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState('')

  const telegramSupportUrl =
    import.meta.env.VITE_TELEGRAM_SUPPORT_URL || 'https://t.me/proofflowbot'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleConnectTelegram = async () => {
    setIsLinking(true)
    setLinkError('')
    try {
      const { token, botUsername } = await createTelegramLinkToken()
      const targetBot = botUsername || 'proofflowbot'
      const url = `https://t.me/${targetBot}?start=link_${token}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setLinkError(err?.message || 'Не удалось сформировать ссылку для привязки Telegram')
    } finally {
      setIsLinking(false)
    }
  }

  const profile = userRecord?.profile
  const telegramUserId = userRecord?.telegramUserId

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
              <span className={styles.infoValue}>
                {profile?.displayName || user?.displayName || 'Пользователь'}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Компания / Проект</span>
              <span className={styles.infoValue}>{profile?.companyName || '—'}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Сфера деятельности</span>
              <span className={styles.infoValue}>{profile?.businessType || '—'}</span>
            </div>

            {profile?.websiteUrl && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Сайт</span>
                <span className={styles.infoValue}>
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit' }}
                  >
                    {profile.websiteUrl} ↗
                  </a>
                </span>
              </div>
            )}

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Статус доступа</span>
              <span className={styles.infoValue}>
                {userRecord?.accessStatus === 'active' ? 'Активен (Бета)' : 'Ожидание'}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ID пользователя</span>
              <span className={styles.infoValue}>{user?.id || '—'}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Подключить Telegram</h2>

          <div className={styles.telegramConnectBox}>
            <div className={styles.telegramConnectHeader}>
              <div className={styles.telegramConnectStatus}>
                {telegramUserId ? (
                  <>
                    <span className={styles.connectedBadge} />
                    <span>Подключен (ID: {telegramUserId})</span>
                  </>
                ) : (
                  <span>Telegram пока не подключен</span>
                )}
              </div>
            </div>

            <p className={styles.supportText}>
              Привязка Telegram позволяет генерировать кейсы через чат-бота, отправлять
              голосовые записи и получать готовые карточки прямо в мессенджер.
            </p>

            <button
              type="button"
              disabled={isLinking}
              onClick={handleConnectTelegram}
              className={styles.connectButton}
            >
              {isLinking
                ? 'Генерация ссылки...'
                : telegramUserId
                  ? 'Привязать другой аккаунт Telegram ↗'
                  : 'Подключить Telegram ↗'}
            </button>

            {linkError && <p className={styles.errorText}>{linkError}</p>}
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
