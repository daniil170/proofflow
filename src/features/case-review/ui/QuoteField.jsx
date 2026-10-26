import PropTypes from 'prop-types'
import styles from './QuoteField.module.css'

export const QuoteField = ({
  quoteText = '',
  authorLabel = '',
  isNeedsReview = false,
  isModified = false,
  hasEvidence = false,
  error = null,
  onQuoteChange,
  onAuthorChange,
  onOpenEvidence,
}) => {
  return (
    <div
      className={`
        ${styles.card}
        ${isNeedsReview ? styles.cardNeedsReview : ''}
      `}
    >
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h3 className={styles.title}>Цитата клиента</h3>
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
            aria-label="Откуда взята цитата"
          >
            <span>🔍</span>
            <span>Откуда это</span>
          </button>
        )}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="quote-text-input" className={styles.inputLabel}>
          Текст дословной цитаты:
        </label>
        <textarea
          id="quote-text-input"
          className={styles.textarea}
          value={quoteText}
          onChange={(e) => onQuoteChange(e.target.value)}
          placeholder="Вставьте подтвержденные слова клиента"
          aria-describedby={error ? 'quote-text-error' : undefined}
          aria-invalid={Boolean(error)}
        />
        {error && (
          <p id="quote-text-error" className={styles.errorMessage}>
            {error}
          </p>
        )}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="quote-author-input" className={styles.inputLabel}>
          Автор (обезличенно по умолчанию):
        </label>
        <input
          id="quote-author-input"
          type="text"
          className={styles.textInput}
          value={authorLabel}
          onChange={(e) => onAuthorChange(e.target.value)}
          placeholder="например: Анна К., Head of Product"
          aria-describedby="quote-author-hint"
        />
        <p id="quote-author-hint" className={styles.anonymizedHint}>
          Полные фамилии и контакты клиента автоматически скрываются для сохранения
          конфиденциальности.
        </p>
      </div>
    </div>
  )
}

QuoteField.propTypes = {
  quoteText: PropTypes.string,
  authorLabel: PropTypes.string,
  isNeedsReview: PropTypes.bool,
  isModified: PropTypes.bool,
  hasEvidence: PropTypes.bool,
  error: PropTypes.string,
  onQuoteChange: PropTypes.func.isRequired,
  onAuthorChange: PropTypes.func.isRequired,
  onOpenEvidence: PropTypes.func,
}
