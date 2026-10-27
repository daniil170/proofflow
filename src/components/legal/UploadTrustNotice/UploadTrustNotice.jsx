import { useState } from 'react'
import PropTypes from 'prop-types'
import { LockIcon } from '../icons.jsx'
import { LegalModal } from '../LegalModal/LegalModal.jsx'
import styles from './UploadTrustNotice.module.css'

export const UploadTrustNotice = ({ className = '', showDetailsModal = true }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className={`${styles.card} ${className}`.trim()} role="note">
        <div className={styles.iconWrap} aria-hidden="true">
          <LockIcon size={14} />
        </div>
        <div className={styles.content}>
          <p className={styles.text}>
            <span className={styles.strong}>Ваши исходные данные защищены:</span>{' '}
            скриншоты не используются для дообучения публичных нейросетей. Включите режим NDA для
            автоматического скрытия имен и контактов.
            {showDetailsModal && (
              <button
                type="button"
                className={styles.infoLink}
                onClick={() => setIsModalOpen(true)}
              >
                Подробнее о гарантиях
              </button>
            )}
          </p>
        </div>
      </div>

      {showDetailsModal && (
        <LegalModal
          isOpen={isModalOpen}
          initialDoc="privacy"
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}

UploadTrustNotice.propTypes = {
  className: PropTypes.string,
  showDetailsModal: PropTypes.bool,
}
