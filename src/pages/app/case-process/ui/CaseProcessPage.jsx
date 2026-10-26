import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CASE_STATUS, CASE_STATUS_LABELS, getCaseRepository } from '@/shared/api'
import { ProcessingScreen, useCaseProgress } from '@/features/case-progress'
import { CaseReviewEditor, useCaseReview } from '@/features/case-review'
import styles from './CaseProcessPage.module.css'

const CaseReviewSection = ({ caseItem, onStatusChange, isUpdating }) => {
  const reviewState = useCaseReview({
    caseItem,
    onVerified: () => {
      onStatusChange(CASE_STATUS.READY)
    },
  })

  return (
    <>
      {caseItem.status === CASE_STATUS.READY && (
        <div className={styles.publishAllowedBanner}>
          <p className={styles.publishAllowedText}>
            ✓ Черновик успешно проверен. Теперь кейс можно опубликовать на сайте.
          </p>
          <button
            type="button"
            className={styles.publishButton}
            onClick={() => onStatusChange(CASE_STATUS.PUBLISHED)}
            disabled={isUpdating}
          >
            Опубликовать кейс
          </button>
        </div>
      )}

      <CaseReviewEditor reviewState={reviewState} />
    </>
  )
}

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
  const isPublishAllowed =
    caseItem.status === CASE_STATUS.READY ||
    caseItem.status === CASE_STATUS.PUBLISHED

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

      <header className={styles.headerCard}>
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
          {isPublishAllowed && caseItem.status !== CASE_STATUS.PUBLISHED && (
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
      </header>

      <CaseReviewSection
        caseItem={caseItem}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdating}
      />
    </div>
  )
}
