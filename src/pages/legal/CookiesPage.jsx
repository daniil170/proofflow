import { useEffect } from 'react'
import {
  CookieIcon,
  LegalLayout,
  SlidersIcon,
  cookiesData,
  openCookieSettings,
  useCookieConsent,
} from '@/components/legal'
import styles from './CookiesPage.module.css'

export const CookiesPage = () => {
  const { consentData } = useCookieConsent()

  useEffect(() => {
    document.title = 'Политика использования файлов cookie — ProofFlow'
    window.scrollTo(0, 0)
  }, [])

  const getStatusText = () => {
    if (!consentData) return 'Выбор еще не зафиксирован (действуют стандартные настройки)'
    if (consentData.consent === 'all') return 'Разрешены все категории (Обязательные, Аналитические, Функциональные)'
    if (consentData.consent === 'necessary') return 'Разрешены только строго необходимые файлы'
    return 'Индивидуальная конфигурация категорий'
  }

  return (
    <LegalLayout doc={cookiesData}>
      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <div className={styles.iconWrapper}>
            <CookieIcon size={18} />
          </div>
          <div>
            <h3 className={styles.statusTitle}>
              Ваш текущий статус согласия
            </h3>
            <p className={styles.statusDescription}>
              {getStatusText()}
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={openCookieSettings}
            className={styles.actionButton}
          >
            <SlidersIcon size={16} />
            Изменить настройки файлов cookie
          </button>
        </div>
      </div>
    </LegalLayout>
  )
}
