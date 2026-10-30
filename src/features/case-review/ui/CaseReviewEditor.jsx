import { useState } from 'react'
import PropTypes from 'prop-types'
import { CaseCard } from '@/widgets/case-card'
import { getAllowedLabelsForVariant } from '@/entities/case'
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
    messenger = 'unknown',
    selectedChatMessages = [],
    allChatMessages = [],

    setActiveTab,
    updateField,
    updateSummaryRow,
    confirmSummaryRow,
    addSummaryRow,
    removeSummaryRow,
    toggleChatMessage,
    handleSetMessenger,
    isFieldModified,
    isFieldNeedsReview,
    isRowNeedsReview,
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
  const allowedLabels = getAllowedLabelsForVariant(selectedVariant)

  const summaryRows = Array.isArray(draft.summaryRows) ? draft.summaryRows : []

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

          <div className={styles.storySectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleArea}>
                <div className={styles.sectionIconBadge}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.sectionHeading}>Заголовок карточки</h3>
                  <p className={styles.sectionSubheading}>
                    Только из подтвержденных слов клиента или проверенной метрики
                  </p>
                </div>
              </div>

              {draft.headline?.evidenceId && (
                <button
                  type="button"
                  className={styles.evidenceButton}
                  onClick={() => openEvidence('headline')}
                  aria-label="Откуда взят заголовок"
                >
                  <SearchIcon size={13} />
                  <span>Откуда это</span>
                </button>
              )}
            </div>

            <div className={styles.tagInputRow}>
              <input
                id="headline-input"
                type="text"
                className={styles.tagsInput}
                value={draft.headline?.text || ''}
                onChange={(e) => updateField('headline.text', e.target.value)}
                placeholder="Короткий акцент из слов клиента (2-6 слов)"
              />
            </div>
          </div>

          <MetricField
            value={draft.metric?.value || ''}
            label={draft.metric?.label || ''}
            isNeedsReview={isFieldNeedsReview('metric')}
            isModified={isFieldModified('metric.value')}
            hasEvidence={Boolean(draft.metric?.evidenceId)}
            error={validationErrors['metric.value']}
            onValueChange={(val) => updateField('metric.value', val)}
            onLabelChange={(val) => updateField('metric.label', val)}
            onOpenEvidence={() => openEvidence('metric')}
          />

          <div className={styles.storySectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleArea}>
                <div className={styles.sectionIconBadge}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.sectionHeading}>Сюжет кейса (строки пересказа)</h3>
                  <p className={styles.sectionSubheading}>
                    Каждая строка опирается на источник. ИИ-пересказ требует подтверждения.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.storyStepsList}>
              {summaryRows.map((row, idx) => {
                const needsRev = isRowNeedsReview ? isRowNeedsReview(row, idx) : false
                const isClientWords = row.origin === 'client_words'
                const isUserWritten = row.origin === 'user_written'

                return (
                  <div
                    key={row.id || `${row.label}-${idx}`}
                    className={`
                      ${styles.storyStep}
                      ${needsRev ? styles.storyStepNeedsReview : ''}
                    `}
                  >
                    <div className={styles.stepHeader}>
                      <div className={styles.stepTitleGroup}>
                        <select
                          className={styles.stepPill}
                          value={row.label}
                          onChange={(e) => updateSummaryRow?.(idx, { label: e.target.value })}
                        >
                          {allowedLabels.map((lab) => (
                            <option key={lab} value={lab}>
                              {lab}
                            </option>
                          ))}
                          {!allowedLabels.includes(row.label) && (
                            <option value={row.label}>{row.label}</option>
                          )}
                        </select>

                        {isClientWords && (
                          <span className={styles.badgeModified} style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>
                            Из слов клиента
                          </span>
                        )}
                        {row.origin === 'ai_paraphrase' && (
                          <span className={styles.badgeModified} style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>
                            Пересказ ИИ
                          </span>
                        )}
                        {isUserWritten && (
                          <span className={styles.badgeModified}>
                            Добавлено вами
                          </span>
                        )}

                        {needsRev && (
                          <span className={styles.badgeNeedsReview}>
                            Проверьте
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {needsRev && (
                          <button
                            type="button"
                            className={styles.evidenceButton}
                            style={{ color: '#059669', borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' }}
                            onClick={() => confirmSummaryRow?.(row.id || `row-${idx}`)}
                          >
                            ✓ Подтвердить
                          </button>
                        )}

                        {row.evidenceId && (
                          <button
                            type="button"
                            className={styles.evidenceButton}
                            onClick={() => openEvidence(row.evidenceId)}
                            aria-label={`Откуда взято: ${row.label}`}
                          >
                            <SearchIcon size={13} />
                            <span>Откуда это</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className={styles.tagRemoveBtn}
                          onClick={() => removeSummaryRow?.(idx)}
                          aria-label="Удалить строку"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <textarea
                      className={styles.textarea}
                      value={row.text || ''}
                      onChange={(e) => updateSummaryRow?.(idx, { text: e.target.value })}
                      placeholder="Фактическое содержание пункта"
                    />
                  </div>
                )
              })}

              <button
                type="button"
                className={styles.evidenceButton}
                style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                onClick={() => addSummaryRow?.({ label: allowedLabels[0] || 'Детали', text: '' })}
              >
                ＋ Добавить строку
              </button>
            </div>
          </div>

          {allChatMessages.length > 0 && (
            <div className={styles.storySectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleArea}>
                  <div className={styles.sectionIconBadge}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.sectionHeading}>Переписка на карточке</h3>
                    <p className={styles.sectionSubheading}>
                      Выберите до трех сообщений из скриншота (выбрано: {selectedChatMessages.length} из 3)
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allChatMessages.map((msg, index) => {
                  const isSelected = selectedChatMessages.some(
                    (m) => m.text === msg.text && m.time === msg.time
                  )
                  return (
                    <div
                      key={`chat-msg-${index}`}
                      onClick={() => toggleChatMessage?.(msg)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ marginTop: '3px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                            {msg.side === 'client' ? 'Клиент' : 'Собеседник'}
                          </span>
                          {msg.time && (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{msg.time}</span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#0f172a', whiteSpace: 'pre-wrap' }}>
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className={styles.storySectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleArea}>
                <div className={styles.sectionIconBadge}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.sectionHeading}>Мессенджер переписки</h3>
                  <p className={styles.sectionSubheading}>
                    Определен по интерфейсу скриншота, вы можете переключить вручную
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { id: 'telegram', label: 'Telegram' },
                { id: 'whatsapp', label: 'WhatsApp' },
                { id: 'unknown', label: 'Переписка (нейтрально)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={styles.variantBtn}
                  style={{
                    backgroundColor: messenger === m.id ? '#0f172a' : '#f1f5f9',
                    color: messenger === m.id ? '#ffffff' : '#0f172a',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                  }}
                  onClick={() => handleSetMessenger?.(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <QuoteField
            quoteText={draft.quote?.text || ''}
            authorLabel={draft.quote?.authorLabel || 'Клиент'}
            authorRole={draft.quote?.authorRole || ''}
            authorCompany={draft.quote?.authorCompany || ''}
            isNeedsReview={isFieldNeedsReview('quote')}
            isModified={isFieldModified('quote.text')}
            hasEvidence={Boolean(draft.quote?.evidenceId)}
            error={validationErrors['quote.text']}
            onQuoteChange={(val) => updateField('quote.text', val)}
            onAuthorChange={(val) => updateField('quote.authorLabel', val)}
            onAuthorRoleChange={(val) => updateField('quote.authorRole', val)}
            onAuthorCompanyChange={(val) => updateField('quote.authorCompany', val)}
            onOpenEvidence={() => openEvidence('quote')}
          />

          <div className={styles.tagsCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleArea}>
                <div className={styles.sectionIconBadge}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    sourcesDeletedAt: PropTypes.any,
    storageRetentionDays: PropTypes.number,
    messenger: PropTypes.string,
    selectedChatMessages: PropTypes.array,
    allChatMessages: PropTypes.array,

    setActiveTab: PropTypes.func.isRequired,
    updateField: PropTypes.func.isRequired,
    updateSummaryRow: PropTypes.func,
    confirmSummaryRow: PropTypes.func,
    addSummaryRow: PropTypes.func,
    removeSummaryRow: PropTypes.func,
    toggleChatMessage: PropTypes.func,
    handleSetMessenger: PropTypes.func,
    isFieldModified: PropTypes.func.isRequired,
    isFieldNeedsReview: PropTypes.func.isRequired,
    isRowNeedsReview: PropTypes.func,
    openEvidence: PropTypes.func.isRequired,
    closeEvidence: PropTypes.func.isRequired,
    markAsVerified: PropTypes.func.isRequired,
    regenerateDraft: PropTypes.func.isRequired,
    submitFeedback: PropTypes.func.isRequired,
  }).isRequired,
}