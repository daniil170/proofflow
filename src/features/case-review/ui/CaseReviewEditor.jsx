import { useState } from 'react'
import PropTypes from 'prop-types'
import { CaseCard } from '@/widgets/case-card'
import { EvidenceDrawer } from './EvidenceDrawer.jsx'
import { MetricField } from './MetricField.jsx'
import { QuoteField } from './QuoteField.jsx'
import { ReviewActions } from './ReviewActions.jsx'
import { ClockIcon, SearchIcon } from '@/shared/ui'
import styles from './CaseReviewEditor.module.css'

const STYLES_LIST = [
  { id: 'dark', title: 'Тёмная' },
  { id: 'whatsapp', title: 'WhatsApp' },
  { id: 'minimal', title: 'Минимализм' },
  { id: 'newspaper', title: 'Газета' },
  { id: 'receipt', title: 'Чек' },
]

export const CaseReviewEditor = ({ reviewState }) => {
  const {
    draft,
    selectedVariant = 'dark',
    handleSelectVariant,
    modifiedFields,
    saveStatus,
    validationErrors,
    canMarkVerified,
    isRegenerating,
    activeEvidence,
    feedbackState,
    activeTab,
    cardPreviewData,
    sourcesDeletedAt,
    storageRetentionDays = 14,

    setActiveTab,
    updateField,
    isFieldModified,
    isFieldNeedsReview,
    openEvidence,
    closeEvidence,
    markAsVerified,
    regenerateDraft,
    submitFeedback,
  } = reviewState

  const [tagInput, setTagInput] = useState(() => (draft.tags || []).join(', '))

  const handleTagsBlur = () => {
    const parsed = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    updateField('tags', parsed)
  }

  const hasModifiedFields = modifiedFields.length > 0

  return (
    <div className={styles.container}>
      <nav className={styles.mobileTabs} aria-label="Переключение вида">
        <button
          type="button"
          className={`
            ${styles.tabButton}
            ${activeTab === 'edit' ? styles.tabButtonActive : ''}
          `}
          onClick={() => setActiveTab('edit')}
        >
          Правка
        </button>
        <button
          type="button"
          className={`
            ${styles.tabButton}
            ${activeTab === 'preview' ? styles.tabButtonActive : ''}
          `}
          onClick={() => setActiveTab('preview')}
        >
          Превью
        </button>
      </nav>

      <div className={styles.layoutSplit}>
        <section
          className={`
            ${styles.editorColumn}
            ${activeTab === 'preview' ? styles.hiddenOnMobile : ''}
          `}
          aria-label="Редактор черновика"
        >
          <div className={styles.retentionNotice} data-testid="review-retention-notice">
            <span className={styles.retentionIcon}>
              <ClockIcon size={15} />
            </span>
            <span>
              <strong>Срок хранения исходников:</strong> {storageRetentionDays} дней.{' '}
              {sourcesDeletedAt
                ? 'Исходные файлы удалены по сроку хранения, сохранённые цитаты зафиксированы.'
                : 'Исходные файлы автоматически удаляются через 14 дней после готовности черновика, цитаты сохраняются навсегда.'}
            </span>
          </div>

          <MetricField
            value={draft.metric.value}
            label={draft.metric.label}
            isNeedsReview={isFieldNeedsReview('metric')}
            isModified={isFieldModified('metric.value')}
            hasEvidence={Boolean(draft.metric.evidenceId)}
            error={validationErrors['metric.value']}
            onValueChange={(val) => updateField('metric.value', val)}
            onLabelChange={(val) => updateField('metric.label', val)}
            onOpenEvidence={() => openEvidence('metric')}
          />

          <div className={styles.storySectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleArea}>
                <div className={styles.sectionIconBadge}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.sectionHeading}>Сюжет кейса</h3>
                  <p className={styles.sectionSubheading}>
                    Проблема клиента → Ваше решение → Полученный результат
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.storyStepsList}>
              <div
                className={`
                  ${styles.storyStep}
                  ${isFieldNeedsReview('problem') ? styles.storyStepNeedsReview : ''}
                `}
              >
                <div className={styles.stepHeader}>
                  <div className={styles.stepTitleGroup}>
                    <span className={`${styles.stepPill} ${styles.stepPillAmber}`}>
                      <span className={styles.stepNumber}>1</span>
                      Было · Проблема клиента
                    </span>
                    {isFieldNeedsReview('problem') && (
                      <span className={styles.badgeNeedsReview}>Проверьте</span>
                    )}
                    {isFieldModified('problem') && (
                      <span className={styles.badgeModified}>Изменено вами</span>
                    )}
                  </div>

                  {!isFieldModified('problem') && (
                    <button
                      type="button"
                      className={styles.evidenceButton}
                      onClick={() => openEvidence('problem')}
                      aria-label="Откуда взята проблема"
                    >
                      <SearchIcon size={13} />
                      <span>Откуда это</span>
                    </button>
                  )}
                </div>

                <textarea
                  id="problem-input"
                  className={styles.textarea}
                  value={draft.problem}
                  onChange={(e) => updateField('problem', e.target.value)}
                  placeholder="С какими трудностями и ограничениями столкнулся клиент"
                  aria-describedby={
                    validationErrors.problem ? 'problem-error' : undefined
                  }
                  aria-invalid={Boolean(validationErrors.problem)}
                />
                {validationErrors.problem && (
                  <p id="problem-error" className={styles.errorMessage}>
                    {validationErrors.problem}
                  </p>
                )}
              </div>

              <div className={styles.stepConnector} aria-hidden="true">
                <div className={styles.connectorLine} />
                <div className={styles.connectorArrow}>↓</div>
              </div>

              <div
                className={`
                  ${styles.storyStep}
                  ${isFieldNeedsReview('solution') ? styles.storyStepNeedsReview : ''}
                `}
              >
                <div className={styles.stepHeader}>
                  <div className={styles.stepTitleGroup}>
                    <span className={`${styles.stepPill} ${styles.stepPillBlue}`}>
                      <span className={styles.stepNumber}>2</span>
                      Сделано · Ваше решение
                    </span>
                    {isFieldNeedsReview('solution') && (
                      <span className={styles.badgeNeedsReview}>Проверьте</span>
                    )}
                    {isFieldModified('solution') && (
                      <span className={styles.badgeModified}>Изменено вами</span>
                    )}
                  </div>

                  {!isFieldModified('solution') && (
                    <button
                      type="button"
                      className={styles.evidenceButton}
                      onClick={() => openEvidence('solution')}
                      aria-label="Откуда взято решение"
                    >
                      <SearchIcon size={13} />
                      <span>Откуда это</span>
                    </button>
                  )}
                </div>

                <textarea
                  id="solution-input"
                  className={styles.textarea}
                  value={draft.solution}
                  onChange={(e) => updateField('solution', e.target.value)}
                  placeholder="Какое конкретное решение или процесс внедрили"
                  aria-describedby={
                    validationErrors.solution ? 'solution-error' : undefined
                  }
                  aria-invalid={Boolean(validationErrors.solution)}
                />
                {validationErrors.solution && (
                  <p id="solution-error" className={styles.errorMessage}>
                    {validationErrors.solution}
                  </p>
                )}
              </div>

              <div className={styles.stepConnector} aria-hidden="true">
                <div className={styles.connectorLine} />
                <div className={styles.connectorArrow}>↓</div>
              </div>

              <div
                className={`
                  ${styles.storyStep}
                  ${isFieldNeedsReview('result') ? styles.storyStepNeedsReview : ''}
                `}
              >
                <div className={styles.stepHeader}>
                  <div className={styles.stepTitleGroup}>
                    <span className={`${styles.stepPill} ${styles.stepPillEmerald}`}>
                      <span className={styles.stepNumber}>3</span>
                      Стало · Достигнутый результат
                    </span>
                    {isFieldNeedsReview('result') && (
                      <span className={styles.badgeNeedsReview}>Проверьте</span>
                    )}
                    {isFieldModified('result') && (
                      <span className={styles.badgeModified}>Изменено вами</span>
                    )}
                  </div>

                  {!isFieldModified('result') && (
                    <button
                      type="button"
                      className={styles.evidenceButton}
                      onClick={() => openEvidence('result')}
                      aria-label="Откуда взят результат"
                    >
                      <SearchIcon size={13} />
                      <span>Откуда это</span>
                    </button>
                  )}
                </div>

                <textarea
                  id="result-input"
                  className={styles.textarea}
                  value={draft.result}
                  onChange={(e) => updateField('result', e.target.value)}
                  placeholder="Как изменились показатели и процессы после запуска"
                  aria-describedby={validationErrors.result ? 'result-error' : undefined}
                  aria-invalid={Boolean(validationErrors.result)}
                />
                {validationErrors.result && (
                  <p id="result-error" className={styles.errorMessage}>
                    {validationErrors.result}
                  </p>
                )}
              </div>
            </div>
          </div>

          <QuoteField
            quoteText={draft.quote.text}
            authorLabel={draft.quote.authorLabel}
            isNeedsReview={isFieldNeedsReview('quote')}
            isModified={isFieldModified('quote.text')}
            hasEvidence={Boolean(draft.quote.evidenceId)}
            error={validationErrors['quote.text']}
            onQuoteChange={(val) => updateField('quote.text', val)}
            onAuthorChange={(val) => updateField('quote.authorLabel', val)}
            onOpenEvidence={() => openEvidence('quote')}
          />

          <div className={styles.tagsCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleArea}>
                <div className={styles.sectionIconBadge}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.sectionHeading}>Теги и ниша проекта</h3>
                  <p className={styles.sectionSubheading}>
                    Помогают клиентам фильтровать кейсы по своей отрасли
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.tagsWrap}>
              {(draft.tags || []).map((tag, idx) => (
                <span key={`${tag}-${idx}`} className={styles.tagChip}>
                  <span>#{tag}</span>
                  <button
                    type="button"
                    className={styles.tagRemoveBtn}
                    onClick={() => {
                      const updated = (draft.tags || []).filter((_, i) => i !== idx)
                      updateField('tags', updated)
                      setTagInput(updated.join(', '))
                    }}
                    aria-label={`Удалить тег ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className={styles.tagInputRow}>
              <input
                id="tags-input"
                type="text"
                className={styles.tagsInput}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onBlur={handleTagsBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleTagsBlur()
                  }
                }}
                placeholder="Добавьте теги через запятую, например: Торты, Кондитерская, Отзыв"
                aria-describedby="tags-hint"
              />
            </div>
            <p id="tags-hint" className={styles.inputHint}>
              Нажмите Enter или кликните в сторону, чтобы сохранить теги.
            </p>
          </div>

          <ReviewActions
            canMarkVerified={canMarkVerified}
            saveStatus={saveStatus}
            isRegenerating={isRegenerating}
            feedbackState={feedbackState}
            hasModifiedFields={hasModifiedFields}
            onMarkVerified={markAsVerified}
            onRegenerate={regenerateDraft}
            onSubmitFeedback={submitFeedback}
          />
        </section>

        <aside
          className={`
            ${styles.previewColumn}
            ${activeTab === 'edit' ? styles.hiddenOnMobile : ''}
          `}
          aria-label="Превью карточки кейса"
        >
          <div className={styles.previewStickyWrapper}>
            <div className={styles.previewHeader}>
              <div className={styles.previewHeadingRow}>
                <h3 className={styles.previewHeading}>Живое превью карточки</h3>
                <span className={styles.liveIndicator}>
                  <span className={styles.liveDot} aria-hidden="true" />
                  Синхронизировано
                </span>
              </div>
              <div className={styles.variantBar}>
                {STYLES_LIST.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    className={`${styles.variantBtn} ${
                      (selectedVariant || 'dark') === style.id ? styles.variantBtnActive : ''
                    }`}
                    onClick={() => handleSelectVariant?.(style.id)}
                  >
                    {style.title}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.previewCardWrapper}>
              <CaseCard variant={selectedVariant || 'dark'} data={cardPreviewData} />
            </div>
          </div>
        </aside>
      </div>

      <EvidenceDrawer activeEvidence={activeEvidence} onClose={closeEvidence} />
    </div>
  )
}

CaseReviewEditor.propTypes = {
  reviewState: PropTypes.shape({
    draft: PropTypes.object.isRequired,
    modifiedFields: PropTypes.array.isRequired,
    saveStatus: PropTypes.string.isRequired,
    validationErrors: PropTypes.object.isRequired,
    canMarkVerified: PropTypes.bool.isRequired,
    isRegenerating: PropTypes.bool.isRequired,
    activeEvidence: PropTypes.object,
    feedbackState: PropTypes.object.isRequired,
    activeTab: PropTypes.string.isRequired,
    cardPreviewData: PropTypes.object.isRequired,

    setActiveTab: PropTypes.func.isRequired,
    updateField: PropTypes.func.isRequired,
    isFieldModified: PropTypes.func.isRequired,
    isFieldNeedsReview: PropTypes.func.isRequired,
    openEvidence: PropTypes.func.isRequired,
    closeEvidence: PropTypes.func.isRequired,
    markAsVerified: PropTypes.func.isRequired,
    regenerateDraft: PropTypes.func.isRequired,
    submitFeedback: PropTypes.func.isRequired,
  }).isRequired,
}
