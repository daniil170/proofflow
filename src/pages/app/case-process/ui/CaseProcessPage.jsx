import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CASE_STATUS, CASE_STATUS_LABELS, getCaseRepository } from '@/shared/api'
import { ProcessingScreen, useCaseProgress } from '@/features/case-progress'
import styles from './CaseProcessPage.module.css'

export const CaseProcessPage = () => {
  const { id } = useParams()
  const progressState = useCaseProgress({ caseId: id })
  const { caseItem, isLoading, error, status } = progressState
  const [isUpdating, setIsUpdating] = useState(false)
  const [actionError, setActionError] = useState(null)

  const handleStatusChange = async (newStatus) => {
    if (!caseItem) return
    setIsUpdating(true)
    setActionError(null)
    try {
      const repository = getCaseRepository()
      await repository.update(caseItem.id, {
        status: newStatus,
      })
    } catch (err) {
      setActionError(err?.message || 'Не удалось обновить статус')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loadingBox}>
        <div className={styles.spinner} />
        <span>Загрузка данных процесса...</span>
      </div>
    )
  }

  if ((error && !caseItem) || !caseItem) {
    return (
      <div className={styles.errorBox}>
        <p>{error || 'Кейс не найден'}</p>
        <Link to="/app" className={styles.backLink}>
          ← Вернуться к списку кейсов
        </Link>
      </div>
    )
  }

  if (status === 'processing' || status === 'failed') {
    return <ProcessingScreen progressState={progressState} />
  }

  const clientLabel = caseItem.clientLabel || caseItem.client || 'Клиент'
  const title = caseItem.title || `Кейс для ${clientLabel}`
  const draft = caseItem.draft
  const metricValue = draft?.metric?.value || caseItem.metric
  const metricLabel = draft?.metric?.label || caseItem.metricLabel
  const quoteText = draft?.quote?.text || caseItem.quote
  const authorLabel = draft?.quote?.authorLabel || caseItem.author

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Link to="/app" className={styles.backLink}>
          ← К списку кейсов
        </Link>

        {caseItem.status === CASE_STATUS.PUBLISHED && (
          <Link
            to={`/c/${caseItem.id}`}
            className={styles.publicLinkButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Открыть публичную страницу</span>
            <span>↗</span>
          </Link>
        )}
      </div>

      {actionError && (
        <div className={styles.errorBox}>
          <p>{actionError}</p>
        </div>
      )}

      <div className={styles.headerCard}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.clientTag}>{clientLabel}</div>
            <h1 className={styles.title}>{title}</h1>
          </div>

          <div
            className={`${styles.statusBadge} ${
              styles[`status_${caseItem.status}`] || ''
            }`}
          >
            <span className={styles.statusDot} />
            <span>{CASE_STATUS_LABELS[caseItem.status] || caseItem.status}</span>
          </div>
        </div>

        <div className={styles.statusControls}>
          <span className={styles.statusLabel}>Изменить статус:</span>
          {caseItem.status !== CASE_STATUS.PROCESSING && (
            <button
              type="button"
              className={styles.statusButton}
              onClick={() => handleStatusChange(CASE_STATUS.PROCESSING)}
              disabled={isUpdating}
            >
              В обработку
            </button>
          )}
          {caseItem.status !== CASE_STATUS.REVIEW && (
            <button
              type="button"
              className={styles.statusButton}
              onClick={() => handleStatusChange(CASE_STATUS.REVIEW)}
              disabled={isUpdating}
            >
              На проверку
            </button>
          )}
          {caseItem.status !== CASE_STATUS.PUBLISHED && (
            <button
              type="button"
              className={styles.statusButton}
              onClick={() => handleStatusChange(CASE_STATUS.PUBLISHED)}
              disabled={isUpdating}
            >
              Опубликовать
            </button>
          )}
          {caseItem.status !== CASE_STATUS.DRAFT && (
            <button
              type="button"
              className={styles.statusButton}
              onClick={() => handleStatusChange(CASE_STATUS.DRAFT)}
              disabled={isUpdating}
            >
              В черновик
            </button>
          )}
        </div>
      </div>

      <div className={styles.previewCard}>
        <h2 className={styles.sectionTitle}>Проверка материалов кейса</h2>

        {metricValue && (
          <div className={styles.metricBanner}>
            <span className={styles.metricValue}>{metricValue}</span>
            {metricLabel && (
              <span className={styles.metricLabel}>{metricLabel}</span>
            )}
          </div>
        )}

        {draft?.problem && (
          <div className={styles.contentBlock}>
            <h3 className={styles.contentHeading}>Проблема</h3>
            <p className={styles.stepDescription}>{draft.problem}</p>
          </div>
        )}

        {draft?.solution && (
          <div className={styles.contentBlock}>
            <h3 className={styles.contentHeading}>Решение</h3>
            <p className={styles.stepDescription}>{draft.solution}</p>
          </div>
        )}

        {draft?.result && (
          <div className={styles.contentBlock}>
            <h3 className={styles.contentHeading}>Результат</h3>
            <p className={styles.stepDescription}>{draft.result}</p>
          </div>
        )}

        {quoteText && (
          <div className={styles.quoteBlock}>
            <p>«{quoteText}»</p>
            {authorLabel && (
              <div className={styles.authorText}>— {authorLabel}</div>
            )}
          </div>
        )}

        {caseItem.summary && !draft && (
          <p className={styles.stepDescription}>{caseItem.summary}</p>
        )}
      </div>
    </div>
  )
}
