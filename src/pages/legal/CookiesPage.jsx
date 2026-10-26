import { useEffect } from 'react'
import {
  CookieIcon,
  LegalLayout,
  SlidersIcon,
  cookiesData,
  openCookieSettings,
  useCookieConsent,
} from '@/components/legal'

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
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-bg-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CookieIcon size={18} />
          </div>
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-bold)',
                margin: 0,
              }}
            >
              Ваш текущий статус согласия
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                margin: '2px 0 0 0',
              }}
            >
              {getStatusText()}
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={openCookieSettings}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1rem',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-accent-text)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'background-color 150ms ease',
            }}
          >
            <SlidersIcon size={16} />
            Изменить настройки файлов cookie
          </button>
        </div>
      </div>
    </LegalLayout>
  )
}
