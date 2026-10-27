import { useState } from 'react'
import PropTypes from 'prop-types'
import { REGENERATE_STYLES } from '../model/useCaseReview.js'
import { ThumbsUpIcon, ThumbsDownIcon } from '@/shared/ui'
import styles from './ReviewActions.module.css'

export const ReviewActions = ({
  canMarkVerified = false,
  saveStatus = 'idle',
  isRegenerating = false,
  feedbackState,
  hasModifiedFields = false,
  onMarkVerified,
  onRegenerate,
  onSubmitFeedback,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [selectedRating, setSelectedRating] = useState(null)

  const handleSelectRegenerate = (mode) => {
    setIsMenuOpen(false)
    let preserve = true
    if (hasModifiedFields) {
      preserve = window.confirm(
        'Сохранить ваши ручные правки при перегенерации текста?'
      )
    }
    onRegenerate(mode, preserve)
  }

  const handleRate = (rating) => {
    setSelectedRating(rating)
  }

  const handleSendFeedback = () => {
    if (!selectedRating) return
    onSubmitFeedback(selectedRating, comment)
  }

  const renderSaveText = () => {
    if (saveStatus === 'saving') {
      return (
        <span className={styles.saveIndicator}>
          <span className={styles.saveDotSaving}>●</span> Сохранение...
        </span>
      )
    }
    if (saveStatus === 'saved') {
      return (
        <span className={styles.saveIndicator}>
          <span className={styles.saveDotSaved}>✓</span> Сохранено
        </span>
      )
    }
    if (saveStatus === 'error') {
      return (
        <span className={styles.saveIndicator}>
          <span className={styles.saveDotSaving}>✕</span> Ошибка автосохранения
        </span>
      )
    }
    return null
  }

  return (
    <footer className={styles.actionsContainer}>
      <div className={styles.topBar}>
        {renderSaveText()}

        <div className={styles.buttonsRow}>
          <button
            type="button"
            className={styles.regenerateButton}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            disabled={isRegenerating}
            aria-expanded={isMenuOpen}
          >
            <span>✨</span>
            <span>{isRegenerating ? 'Генерация...' : 'Перегенерировать'}</span>
          </button>

          <button
            type="button"
            className={styles.verifyButton}
            onClick={onMarkVerified}
            disabled={!canMarkVerified}
          >
            <span>✓</span>
            <span>Проверил, всё верно</span>
          </button>
        </div>
      </div>

      {!canMarkVerified && (
        <p className={styles.disabledHint}>
          Кнопка «Проверил, всё верно» станет активна, когда не останется полей со
          статусом «Проверьте» и будут заполнены обязательные данные.
        </p>
      )}

      {isMenuOpen && (
        <div className={styles.regenerateMenu} role="region" aria-label="Варианты генерации">
          <p className={styles.menuTitle}>Выберите тональность перегенерации:</p>
          {Object.values(REGENERATE_STYLES).map((style) => (
            <button
              key={style.id}
              type="button"
              className={styles.menuOption}
              onClick={() => handleSelectRegenerate(style.id)}
            >
              <span className={styles.optionLabel}>{style.label}</span>
              <span className={styles.optionDesc}>{style.description}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.feedbackSection}>
        <p className={styles.feedbackTitle}>Кейс получился?</p>

        {feedbackState?.isSubmitted ? (
          <p className={styles.feedbackThankYou}>
            Спасибо за отзыв! Ваша оценка поможет улучшить качество анализа.
          </p>
        ) : (
          <div className={styles.feedbackForm}>
            <div className={styles.ratingButtons}>
              <button
                type="button"
                className={`
                  ${styles.ratingButton}
                  ${selectedRating === 'positive' ? styles.ratingButtonActive : ''}
                `}
                onClick={() => handleRate('positive')}
                aria-label="Оценить положительно"
              >
                <ThumbsUpIcon size={14} />
                <span>Да, отлично</span>
              </button>
              <button
                type="button"
                className={`
                  ${styles.ratingButton}
                  ${selectedRating === 'negative' ? styles.ratingButtonActive : ''}
                `}
                onClick={() => handleRate('negative')}
                aria-label="Оценить отрицательно"
              >
                <ThumbsDownIcon size={14} />
                <span>Нужны доработки</span>
              </button>
            </div>

            {selectedRating && (
              <>
                <textarea
                  className={styles.commentInput}
                  placeholder="Что исправить или улучшить? (необязательно)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.submitFeedbackButton}
                  onClick={handleSendFeedback}
                  disabled={feedbackState?.isSubmitting}
                >
                  {feedbackState?.isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </footer>
  )
}

ReviewActions.propTypes = {
  canMarkVerified: PropTypes.bool,
  saveStatus: PropTypes.string,
  isRegenerating: PropTypes.bool,
  feedbackState: PropTypes.shape({
    isSubmitted: PropTypes.bool,
    isSubmitting: PropTypes.bool,
  }),
  hasModifiedFields: PropTypes.bool,
  onMarkVerified: PropTypes.func.isRequired,
  onRegenerate: PropTypes.func.isRequired,
  onSubmitFeedback: PropTypes.func.isRequired,
}
