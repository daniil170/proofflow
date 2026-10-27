import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { SourcePreview } from './SourcePreview.jsx'
import styles from './EvidenceDrawer.module.css'

export const EvidenceDrawer = ({ activeEvidence, onClose }) => {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!activeEvidence) return undefined

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeEvidence, onClose])

  if (!activeEvidence) {
    return null
  }

  const { evidence, source, fieldName, sourcesDeletedAt } = activeEvidence

  const fieldLabels = {
    metric: 'Метрика и результат',
    quote: 'Цитата клиента',
    problem: 'Раздел «Было»',
    solution: 'Раздел «Сделано»',
    result: 'Раздел «Стало»',
  }

  const title = fieldLabels[fieldName] || 'Первоисточник цитаты'

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="evidence-drawer-title" className={styles.title}>
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть источник"
          >
            ✕
          </button>
        </header>

        <div className={styles.body}>
          <SourcePreview
            evidence={evidence}
            source={source}
            sourcesDeletedAt={sourcesDeletedAt}
          />

          <p className={styles.infoNote}>
            Вы можете сверить распознанный текст с исходным материалом. Если здесь
            есть неточность — отредактируйте поле в черновике.
          </p>
        </div>
      </div>
    </div>
  )
}

EvidenceDrawer.propTypes = {
  activeEvidence: PropTypes.shape({
    evidence: PropTypes.object,
    source: PropTypes.object,
    fieldName: PropTypes.string,
    sourcesDeletedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }),
  onClose: PropTypes.func.isRequired,
}
