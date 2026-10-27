import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { exportUserData, getCaseRepository, getUserRepository } from '@/shared/api'
import styles from './SettingsPage.module.css'

export const SettingsPage = () => {
  const { user, userRecord, logout, createTelegramLinkToken } = useAuth()
  const navigate = useNavigate()

  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState('')

  const [userCases, setUserCases] = useState([])
  const [isLoadingCases, setIsLoadingCases] = useState(true)
  const [caseToDelete, setCaseToDelete] = useState(null)
  const [isDeletingCase, setIsDeletingCase] = useState(false)
  const [caseActionError, setCaseActionError] = useState('')

  const [isExportingData, setIsExportingData] = useState(false)

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState('')

  const caseRepo = useMemo(() => getCaseRepository(), [])
  const userRepo = useMemo(() => getUserRepository(), [])

  const telegramSupportUrl =
    import.meta.env.VITE_TELEGRAM_SUPPORT_URL || 'https://t.me/proofflowbot'

  useEffect(() => {
    if (!user?.id) return
    const unsubscribe = caseRepo.subscribeByOwner(
      user.id,
      (cases) => {
        setUserCases(cases || [])
        setIsLoadingCases(false)
      },
      () => {
        setIsLoadingCases(false)
      }
    )
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [user?.id, caseRepo])

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

  const handleDeleteCase = async () => {
    if (!caseToDelete) return
    setIsDeletingCase(true)
    setCaseActionError('')
    try {
      if (typeof caseRepo.delete === 'function') {
        await caseRepo.delete(caseToDelete.id)
      }
      setCaseToDelete(null)
    } catch (err) {
      setCaseActionError(err?.message || 'Не удалось удалить кейс')
    } finally {
      setIsDeletingCase(false)
    }
  }

  const handleExportData = async () => {
    setIsExportingData(true)
    try {
      await exportUserData({ user, userRecord, caseRepository: caseRepo })
    } catch (err) {
      setCaseActionError(err?.message || 'Не удалось экспортировать данные')
    } finally {
      setIsExportingData(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteAccountConfirmText.trim().toUpperCase() !== 'УДАЛИТЬ') {
      setDeleteAccountError('Для подтверждения введите слово «УДАЛИТЬ»')
      return
    }
    setIsDeletingAccount(true)
    setDeleteAccountError('')
    try {
      if (typeof userRepo.deleteAccount === 'function') {
        await userRepo.deleteAccount('УДАЛИТЬ')
      }
      await logout()
      navigate('/login')
    } catch (err) {
      setDeleteAccountError(err?.message || 'Не удалось удалить аккаунт')
      setIsDeletingAccount(false)
    }
  }

  const profile = userRecord?.profile
  const telegramUserId = userRecord?.telegramUserId

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Настройки</h1>
        <p className={styles.subtitle}>Управление учетной записью, кейсами и данными</p>
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
          <h2 className={styles.sectionTitle}>Управление кейсами</h2>
          <p className={styles.supportText}>
            Удаление кейса безвозвратно удаляет его исходные файлы из хранилища, черновики,
            публичную ссылку и клиентские согласия.
          </p>

          {caseActionError && <p className={styles.errorText}>{caseActionError}</p>}

          <div className={styles.casesBox}>
            {isLoadingCases ? (
              <p className={styles.supportText}>Загрузка кейсов...</p>
            ) : userCases.length === 0 ? (
              <p className={styles.supportText}>У вас пока нет созданных кейсов.</p>
            ) : (
              userCases.map((item) => (
                <div key={item.id} className={styles.caseRow}>
                  <div className={styles.caseInfo}>
                    <span className={styles.caseTitle}>
                      {item.title || item.client || item.clientLabel || item.id}
                    </span>
                    <span className={styles.caseMeta}>
                      Статус: {item.status} · {item.sources?.length || 0} файлов
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.deleteCaseBtn}
                    onClick={() => setCaseToDelete(item)}
                  >
                    Удалить
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Экспорт данных (GDPR / JSON)</h2>
          <p className={styles.supportText}>
            Выгрузите все свои данные: информацию профиля, историю согласований и сгенерированные
            кейсы в структурированном формате JSON.
          </p>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleExportData}
            disabled={isExportingData}
          >
            {isExportingData ? 'Формирование выгрузки...' : 'Экспорт своих данных в JSON'}
          </button>
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
              Привязка Telegram позволяет генерировать кейсы через чат-бота, отправлять голосовые
              записи и получать готовые карточки прямо в мессенджер.
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

        <div className={styles.dangerSection}>
          <h2 className={styles.dangerTitle}>Опасная зона</h2>
          <p className={styles.supportText}>
            Удаление аккаунта приведет к безвозвратному удалению профиля, всех созданных кейсов,
            исходных скриншотов, аудиозаписей и отзыву всех выданных ссылок.
          </p>
          <button
            type="button"
            className={styles.dangerBtn}
            onClick={() => {
              setDeleteAccountError('')
              setDeleteAccountConfirmText('')
              setShowDeleteAccountModal(true)
            }}
          >
            Удалить аккаунт и все данные
          </button>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Сессия</h2>
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            Выйти из аккаунта
          </button>
        </div>
      </div>

      {caseToDelete && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <h3 className={styles.sectionTitle}>Удаление кейса</h3>
            <p className={styles.supportText}>
              Вы уверены, что хотите удалить кейс «
              {caseToDelete.title || caseToDelete.client || caseToDelete.id}»? Все исходные файлы,
              публичная страница и согласия будут удалены без возможности восстановления.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setCaseToDelete(null)}
                disabled={isDeletingCase}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={handleDeleteCase}
                disabled={isDeletingCase}
              >
                {isDeletingCase ? 'Удаление...' : 'Да, удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAccountModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <h3 className={styles.dangerTitle}>Удаление аккаунта и всех данных</h3>
            <p className={styles.supportText}>
              Это действие необратимо. Будут удалены все ваши кейсы ({userCases.length}), все файлы
              из хранилища и ваша учетная запись.
            </p>
            <p className={styles.supportText}>
              Для подтверждения введите слово <strong>УДАЛИТЬ</strong> ниже:
            </p>
            <input
              type="text"
              value={deleteAccountConfirmText}
              onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
              placeholder="УДАЛИТЬ"
              className={styles.confirmInput}
              disabled={isDeletingAccount}
            />
            {deleteAccountError && <p className={styles.errorText}>{deleteAccountError}</p>}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={isDeletingAccount}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={handleDeleteAccount}
                disabled={
                  isDeletingAccount ||
                  deleteAccountConfirmText.trim().toUpperCase() !== 'УДАЛИТЬ'
                }
              >
                {isDeletingAccount ? 'Удаление аккаунта...' : 'Удалить аккаунт навсегда'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
