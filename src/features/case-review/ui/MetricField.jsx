import PropTypes from 'prop-types'
import { SearchIcon } from '@/shared/ui'
import styles from './MetricField.module.css'

export const MetricField = ({
  value = '',
  label = '',
  isNeedsReview = false,
  isModified = false,
  hasEvidence = false,
  error = null,
  onValueChange,
  onLabelChange,
  onOpenEvidence,
}) => {
  const stringValue = typeof value === 'string' ? value : String(value ?? '')
  const isUnconfirmed = !stringValue || stringValue.trim().length === 0

  return (
    <div
      className={`
        ${styles.card}
        ${isNeedsReview ? styles.cardNeedsReview : ''}
      `}
    >
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h3 className={styles.title}>Главная метрика кейса</h3>
          {isNeedsReview && (
            <span className={styles.badgeNeedsReview}>Проверьте</span>
          )}
          {isModified && (
            <span className={styles.badgeModified}>Изменено вами</span>
          )}
        </div>

        {hasEvidence && !isModified && (
          <button
            type="button"
            className={styles.evidenceButton}
            onClick={onOpenEvidence}
            aria-label="Откуда взята метрика"
          >
            <SearchIcon size={13} />
            <span>Откуда это</span>
          </button>
        )}
      </div>

      <div className={styles.fieldsGrid}>
        <div className={styles.inputGroup}>
          <label htmlFor="metric-value-input" className={styles.inputLabel}>
            Значение / цифра:
          </label>
          <input
            id="metric-value-input"
            type="text"
            className={`
              ${styles.textInput}
              ${isUnconfirmed ? styles.textInputWarning : ''}
            `}
            value={stringValue}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="Какой был результат? Впишите цифру (например: +140% или 3x)"
            aria-describedby={
              error
                ? 'metric-value-error'
                : isUnconfirmed
                ? 'metric-value-prompt'
                : undefined
            }
            aria-invalid={Boolean(error)}
          />

          {isUnconfirmed && (
            <p id="metric-value-prompt" className={styles.unconfirmedPrompt}>
              Какой был результат? Впишите цифру (например: +30% к выручке, 2.5x быстрее).
              Модель не выдумывает числа.
            </p>
          )}

          {error && (
            <p id="metric-value-error" className={styles.errorMessage}>
              {error}
            </p>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="metric-label-input" className={styles.inputLabel}>
            Подпись к метрике:
          </label>
          <input
            id="metric-label-input"
            type="text"
            className={styles.textInput}
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="например: рост целевых заявок"
          />
        </div>
      </div>
    </div>
  )
}

MetricField.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  isNeedsReview: PropTypes.bool,
  isModified: PropTypes.bool,
  hasEvidence: PropTypes.bool,
  error: PropTypes.string,
  onValueChange: PropTypes.func.isRequired,
  onLabelChange: PropTypes.func.isRequired,
  onOpenEvidence: PropTypes.func,
}
