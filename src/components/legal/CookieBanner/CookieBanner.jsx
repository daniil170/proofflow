import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { CookieIcon, SlidersIcon, XIcon } from '../icons.jsx'
import { useCookieConsent } from './useCookieConsent.js'
import styles from './CookieBanner.module.css'

const CookieSettingsModal = ({
  initialAnalytics,
  initialFunctional,
  onClose,
  onSave,
  onAcceptAll,
}) => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(initialAnalytics)
  const [functionalEnabled, setFunctionalEnabled] = useState(initialFunctional)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSave = () => {
    onSave({
      essential: true,
      analytics: analyticsEnabled,
      functional: functionalEnabled,
    })
  }

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-settings-title"
    >
      <div className={styles.settingsCard}>
        <div className={styles.settingsHeader}>
          <div>
            <h3 id="cookie-settings-title" className={styles.settingsTitle}>
              Настройки файлов cookie
            </h3>
            <p className={styles.categoryDesc}>
              Выберите категории файлов cookie, которые вы разрешаете использовать.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть настройки"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className={styles.categoriesList}>
          <div className={styles.categoryItem}>
            <input
              type="checkbox"
              id="cookie-essential"
              checked
              disabled
              className={styles.categoryCheckbox}
              aria-describedby="cookie-essential-desc"
            />
            <div className={styles.categoryMeta}>
              <div className={styles.categoryTitleRow}>
                <label htmlFor="cookie-essential" className={styles.categoryTitle}>
                  Строго необходимые
                </label>
                <span className={styles.lockedBadge}>Всегда активны</span>
              </div>
              <p id="cookie-essential-desc" className={styles.categoryDesc}>
                Обеспечивают авторизацию, безопасность сессий (CSRF) и фиксацию статуса согласия. Не
                могут быть отключены.
              </p>
            </div>
          </div>

          <div className={styles.categoryItem}>
            <input
              type="checkbox"
              id="cookie-functional"
              checked={functionalEnabled}
              onChange={(e) => setFunctionalEnabled(e.target.checked)}
              className={styles.categoryCheckbox}
              aria-describedby="cookie-functional-desc"
            />
            <div className={styles.categoryMeta}>
              <div className={styles.categoryTitleRow}>
                <label htmlFor="cookie-functional" className={styles.categoryTitle}>
                  Функциональные
                </label>
              </div>
              <p id="cookie-functional-desc" className={styles.categoryDesc}>
                Сохраняют выбранный формат кейса (B2C Сторис, B2B Мини-кейс, Чек, Газета), тему
                оформления и персональные предпочтения редактора.
              </p>
            </div>
          </div>

          <div className={styles.categoryItem}>
            <input
              type="checkbox"
              id="cookie-analytics"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              className={styles.categoryCheckbox}
              aria-describedby="cookie-analytics-desc"
            />
            <div className={styles.categoryMeta}>
              <div className={styles.categoryTitleRow}>
                <label htmlFor="cookie-analytics" className={styles.categoryTitle}>
                  Аналитические
                </label>
              </div>
              <p id="cookie-analytics-desc" className={styles.categoryDesc}>
                Помогают анализировать популярность стилей и выявлять сбои в процессе генерации. Все
                данные обезличены.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.settingsActions}>
          <button
            type="button"
            onClick={onAcceptAll}
            className={styles.btnSecondary}
          >
            Разрешить все
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={styles.btnPrimary}
          >
            Сохранить настройки
          </button>
        </div>
      </div>
    </div>
  )
}

CookieSettingsModal.propTypes = {
  initialAnalytics: PropTypes.bool.isRequired,
  initialFunctional: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onAcceptAll: PropTypes.func.isRequired,
}

export const CookieBanner = ({ policyUrl = '/cookies' }) => {
  const {
    consentData,
    isBannerVisible,
    isSettingsOpen,
    setIsSettingsOpen,
    acceptAll,
    acceptNecessary,
    saveCustom,
    openSettings,
  } = useCookieConsent()

  return (
    <>
      {isBannerVisible && (
        <aside
          className={styles.bannerWrapper}
          role="region"
          aria-label="Управление файлами cookie"
        >
          <div className={styles.bannerCard}>
            <div className={styles.header}>
              <div className={styles.iconBadge} aria-hidden="true">
                <CookieIcon size={18} />
              </div>
              <h2 className={styles.title}>Мы используем cookies</h2>
            </div>

            <p className={styles.description}>
              Файлы cookie помогают персонализировать интерфейс, сохранять черновики кейсов и делать
              ProofFlow лучше. Подробнее в нашей{' '}
              <a href={policyUrl} className={styles.policyLink}>
                Политике использования cookie
              </a>
              .
            </p>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={acceptAll}
                className={styles.btnPrimary}
              >
                Принять все
              </button>
              <button
                type="button"
                onClick={acceptNecessary}
                className={styles.btnSecondary}
              >
                Только обязательные
              </button>
              <button
                type="button"
                onClick={openSettings}
                className={styles.btnSettings}
                aria-label="Настроить категории файлов cookie"
              >
                <SlidersIcon size={14} />
                Настройки
              </button>
            </div>
          </div>
        </aside>
      )}

      {isSettingsOpen && (
        <CookieSettingsModal
          initialAnalytics={Boolean(consentData?.categories?.analytics)}
          initialFunctional={Boolean(consentData?.categories?.functional)}
          onClose={() => setIsSettingsOpen(false)}
          onSave={saveCustom}
          onAcceptAll={acceptAll}
        />
      )}
    </>
  )
}

CookieBanner.propTypes = {
  policyUrl: PropTypes.string,
}
