import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { exportUserData, getCaseRepository, getUserRepository } from '@/shared/api'
import { TelegramIcon, UserIcon, FolderIcon, DownloadIcon, ShieldIcon } from '@/shared/ui'
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
      if (typeof caseRepo.deleteByOwner === 'function') {
        await caseRepo.deleteByOwner(user.id)
      }
      if (typeof userRepo.deleteAccount === 'function') {
        await userRepo.deleteAccount(user.id)
      }
      await logout()
      navigate('/login')
    } catch (err) {
      setDeleteAccountError(err?.message || 'Не удалось удалить аккаунт')
      setIsDeletingAccount(false)
    }
  }

  const profile = userRecord?.profile || {}
  const telegramUserId = userRecord?.telegramUserId

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Настройки</h1>
        <p className={styles.subtitle}>Управление учетной записью, кейсами и интеграциями</p>
      </header>

      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>
              <UserIcon size={18} />
            </span>
            <h2 className={styles.sectionTitle}>Профиль</h2>
          </div>

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
                    className={styles.link}
                  >
                    {profile.websiteUrl} ↗
                  </a>
                </span>
              </div>
            )}

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Статус доступа</span>
              <span className={styles.statusBadge}>
                {userRecord?.accessStatus === 'active' ? 'Активен (Бета)' : 'Ожидание'}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ID пользователя</span>
              <span className={styles.infoValueMuted}>{user?.id || '—'}</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>
              <TelegramIcon size={18} />
            </span>
            <h2 className={styles.sectionTitle}>Подключение Telegram</h2>
          </div>

          <div className={styles.telegramBox}>
            <div className={styles.telegramStatusRow}>
              <span className={styles.telegramStatusLabel}>Статус подключения:</span>
              {telegramUserId ? (
                <span className={styles.connectedBadge}>
                  Подключен (ID: {telegramUserId})
                </span>
              ) : (
                <span className={styles.notConnectedBadge}>Не подключен</span>
              )}
            </div>

            <p className={styles.supportText}>
              Привязка Telegram позволяет отправлять голосовые записи и скриншоты напрямую в чат-бот ProofFlow для мгновенной сборки кейсов.
            </p>

            <button
              type="button"
              disabled={isLinking}
              onClick={handleConnectTelegram}
              className={styles.primaryBtn}
            >
              <TelegramIcon size={16} />
              <span>
                {isLinking
                  ? 'Генерация ссылки...'
                  : telegramUserId
                  ? 'Привязать другой аккаунт'
                  : 'Подключить Telegram'}
              </span>
            </button>

            {linkError && <p className={styles.errorText}>{linkError}</p>}
          </div>

          <div className={styles.supportDivider} />

          <div className={styles.supportMini}>
            <h3 className={styles.miniTitle}>Поддержка</h3>
            <p className={styles.supportText}>
              Вопросы или предложения по продукту? Напишите напрямую фаундеру.
            </p>
            <a
              href={telegramSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryBtn}
            >
              Написать в Telegram ↗
            </a>
          </div>
        </div>

        <div className={`${styles.card} ${styles.fullWidth}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>
              <FolderIcon size={18} />
            </span>
            <div>
              <h2 className={styles.sectionTitle}>Управление кейсами</h2>
              <p className={styles.supportText}>
                Удаление кейса безвозвратно удаляет его исходные файлы из хранилища, черновики,
                публичную ссылку и клиентские согласия.
              </p>
            </div>
          </div>

          {caseActionError && <p className={styles.errorText}>{caseActionError}</p>}

          <div className={styles.casesList}>
            {isLoadingCases ? (
              <p className={styles.supportText}>Загрузка кейсов...</p>
            ) : userCases.length === 0 ? (
              <div className={styles.emptyCases}>
                <p className={styles.supportText}>У вас пока нет созданных кейсов.</p>
              </div>
            ) : (
              userCases.map((item) => (
                <div key={item.id} className={styles.caseRow}>
                  <div className={styles.caseInfo}>
                    <span className={styles.caseTitle}>
                      {item.title || item.client || item.clientLabel || item.id}
                    </span>
                    <span className={styles.caseMeta}>
                      Статус: {item.status} · Файлов: {item.sources?.length || 0}
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

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>
              <DownloadIcon size={18} />
            </span>
            <h2 className={styles.sectionTitle}>Экспорт данных</h2>
          </div>
          <p className={styles.supportText}>
            Выгрузите все свои данные в формате JSON (информация профиля, история согласований и кейсы).
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

        <div className={`${styles.card} ${styles.dangerCard}`}>
          <div className={styles.cardHeader}>
            <span className={styles.dangerIcon}>
              <ShieldIcon size={18} color="#ef4444" />
            </span>
            <h2 className={styles.dangerTitle}>Аккаунт и безопасность</h2>
          </div>
          <p className={styles.supportText}>
            Завершить сессию на этом устройстве или удалить аккаунт и все связанные материалы.
          </p>
          <div className={styles.dangerActions}>
            <button type="button" className={styles.secondaryBtn} onClick={handleLogout}>
              Выйти из аккаунта
            </button>
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
