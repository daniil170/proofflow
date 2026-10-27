import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CASE_STATUS, CASE_STATUS_LABELS, getCaseRepository } from '@/shared/api'
import { ProcessingScreen, useCaseProgress } from '@/features/case-progress'
import { CaseReviewEditor, useCaseReview } from '@/features/case-review'
import { CaseStyleSelector, useCaseStyle } from '@/features/case-style'
import { PublishSection } from '@/features/case-publish'
import { useAuth } from '@/features/auth'
import styles from './CaseProcessPage.module.css'

export const CaseProcessPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const progressState = useCaseProgress({ caseId: id })
  const { caseItem, isLoading, error, status } = progressState
  const [activeStepOverride, setActiveStepOverride] = useState(null)
  const [actionError, setActionError] = useState(null)

  const computedDefaultStep = caseItem?.status === CASE_STATUS.PUBLISHED
    ? 'publish'
    : caseItem?.status === CASE_STATUS.READY
      ? 'style'
      : 'review'

  const activeStep = activeStepOverride || computedDefaultStep
  const setActiveStep = (step) => setActiveStepOverride(step)

  const handleStatusChange = async (newStatus) => {
    if (!caseItem) return
    setActionError(null)
    try {
      const repository = getCaseRepository()
      await repository.update(caseItem.id, {
        status: newStatus,
      })
    } catch (err) {
      setActionError(err?.message || 'Не удалось обновить статус')
    }
  }

  const reviewState = useCaseReview({
    caseItem,
    onVerified: () => {
      handleStatusChange(CASE_STATUS.READY)
      setActiveStep('style')
    },
  })

  const styleState = useCaseStyle({
    caseItem,
    userProfile: user?.profile,
    onSave: () => {
      setActiveStep('publish')
    },
  })

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

        <nav className={styles.stepperTabs} aria-label="Шаги подготовки кейса">
          <button
            type="button"
            className={`${styles.stepTab} ${activeStep === 'review' ? styles.stepTabActive : ''}`}
            onClick={() => setActiveStep('review')}
          >
            1. Проверка черновика
          </button>
          <button
            type="button"
            className={`${styles.stepTab} ${activeStep === 'style' ? styles.stepTabActive : ''}`}
            onClick={() => setActiveStep('style')}
          >
            2. Стиль и брендинг
          </button>
          <button
            type="button"
            className={`${styles.stepTab} ${activeStep === 'publish' ? styles.stepTabActive : ''}`}
            onClick={() => setActiveStep('publish')}
          >
            3. Публикация и экспорт
          </button>
        </nav>
      </header>

      {activeStep === 'review' && (
        <CaseReviewEditor reviewState={reviewState} />
      )}

      {activeStep === 'style' && (
        <CaseStyleSelector
          styleState={styleState}
          onNextStep={() => setActiveStep('publish')}
        />
      )}

      {activeStep === 'publish' && (
        <PublishSection
          caseItem={caseItem}
          onPublishChanged={(patch) => {
            if (patch.status) {
              handleStatusChange(patch.status)
            }
          }}
        />
      )}
    </div>
  )
}
