import PropTypes from 'prop-types'
import { SearchIcon } from '@/shared/ui'
import styles from './QuoteField.module.css'

export const QuoteField = ({
  quoteText = '',
  authorLabel = '',
  authorRole = '',
  authorCompany = '',
  isNeedsReview = false,
  isModified = false,
  hasEvidence = false,
  error = null,
  onQuoteChange,
  onAuthorChange,
  onAuthorRoleChange,
  onAuthorCompanyChange,
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
          <h3 className={styles.title}>Цитата и автор</h3>
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
            <SearchIcon size={13} />
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
          Подпись автора:
        </label>
        <input
          id="quote-author-input"
          type="text"
          className={styles.textInput}
          value={authorLabel}
          onChange={(e) => onAuthorChange(e.target.value)}
          placeholder="Клиент"
          aria-describedby="quote-author-hint"
        />
        <p id="quote-author-hint" className={styles.inputHint}>
          Имя и первая буква фамилии, только если клиент согласен. По умолчанию «Клиент».
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className={styles.inputGroup}>
          <label htmlFor="quote-role-input" className={styles.inputLabel}>
            Роль клиента (необязательно):
          </label>
          <input
            id="quote-role-input"
            type="text"
            className={styles.textInput}
            value={authorRole}
            onChange={(e) => onAuthorRoleChange?.(e.target.value)}
            placeholder="например: Студент курса"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="quote-company-input" className={styles.inputLabel}>
            Компания клиента (необязательно):
          </label>
          <input
            id="quote-company-input"
            type="text"
            className={styles.textInput}
            value={authorCompany}
            onChange={(e) => onAuthorCompanyChange?.(e.target.value)}
            placeholder="например: Яндекс"
          />
        </div>
      </div>
    </div>
  )
}

QuoteField.propTypes = {
  quoteText: PropTypes.string,
  authorLabel: PropTypes.string,
  authorRole: PropTypes.string,
  authorCompany: PropTypes.string,
  isNeedsReview: PropTypes.bool,
  isModified: PropTypes.bool,
  hasEvidence: PropTypes.bool,
  error: PropTypes.string,
  onQuoteChange: PropTypes.func.isRequired,
  onAuthorChange: PropTypes.func.isRequired,
  onAuthorRoleChange: PropTypes.func,
  onAuthorCompanyChange: PropTypes.func,
  onOpenEvidence: PropTypes.func,
}