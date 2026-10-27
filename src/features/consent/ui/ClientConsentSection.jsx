import PropTypes from 'prop-types'
import { useClientConsent } from '../model/useClientConsent'
import styles from './ClientConsentSection.module.css'

export const ClientConsentSection = ({ caseItem, onConsentUpdated }) => {
  const {
    consentUrl,
    isLoading,
    error,
    copied,
    createConsentLink,
    confirmDirectConsent,
    copyConsentLink,
  } = useClientConsent({ caseItem, onConsentUpdated })

  const status = caseItem?.clientConsentStatus || (caseItem?.consentConfirmed ? 'approved' : 'none')

  const getStatusBadge = () => {
    if (status === 'approved' || caseItem?.consentConfirmed) {
      return <span className={`${styles.badge} ${styles.badgeApproved}`}>✓ Согласие подтверждено</span>
    }
    if (status === 'pending') {
      return <span className={`${styles.badge} ${styles.badgePending}`}>⏳ Ожидает решения клиента</span>
    }
    if (status === 'declined') {
      return <span className={`${styles.badge} ${styles.badgeDeclined}`}>✕ Клиент отклонил</span>
    }
    return <span className={`${styles.badge} ${styles.badgeNone}`}>Не запрошено</span>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Согласие клиента на публикацию</h3>
        {getStatusBadge()}
      </div>

      <p className={styles.description}>
        Вы можете отправить клиенту короткую ссылку для предварительного согласования без авторизации. Решение клиента фиксируется автоматически.
      </p>

      {consentUrl ? (
        <div className={styles.linkBox}>
          <input
            type="text"
            readOnly
            value={consentUrl}
            className={styles.urlInput}
          />
          <button
            type="button"
            className={`${styles.actionBtn} ${copied ? styles.actionBtnPrimary : ''}`}
            onClick={copyConsentLink}
          >
            {copied ? 'Скопировано!' : 'Скопировать'}
          </button>
        </div>
      ) : (
        <div className={styles.buttonsRow}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={createConsentLink}
            disabled={isLoading}
          >
            {isLoading ? 'Генерация ссылки...' : 'Отправить клиенту ссылку на согласие'}
          </button>

          {!caseItem?.consentConfirmed && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={confirmDirectConsent}
              disabled={isLoading}
            >
              Подтвердить согласие устно/в переписке
            </button>
          )}
        </div>
      )}

      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{error}</span>}
    </div>
  )
}

ClientConsentSection.propTypes = {
  caseItem: PropTypes.shape({
    id: PropTypes.string,
    consentConfirmed: PropTypes.bool,
    clientConsentStatus: PropTypes.string,
  }),
  onConsentUpdated: PropTypes.func,
}
