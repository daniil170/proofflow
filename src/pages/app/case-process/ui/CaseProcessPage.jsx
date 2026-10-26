import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CASE_STATUS, CASE_STATUS_LABELS, getCaseRepository } from '@/shared/api'
import styles from './CaseProcessPage.module.css'

export const CaseProcessPage = () => {
  const { id } = useParams()
  const [caseItem, setCaseItem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    const repository = getCaseRepository()

    repository
      .getById(id)
      .then((item) => {
        if (!isMounted) return
        if (!item) {
          setError('Кейс не найден')
        } else {
          setCaseItem(item)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err?.message || 'Ошибка загрузки данных кейса')
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id])

  const handleStatusChange = async (newStatus) => {
    if (!caseItem) return
    setIsUpdating(true)
    try {
      const repository = getCaseRepository()
      const updated = await repository.update(caseItem.id, {
        status: newStatus,
      })
      setCaseItem((prev) => ({ ...prev, ...updated, status: newStatus }))
    } catch (err) {
      setError(err?.message || 'Не удалось обновить статус')
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

  if (error || !caseItem) {
    return (
      <div className={styles.errorBox}>
        <p>{error || 'Кейс не найден'}</p>
        <Link to="/app" className={styles.backLink}>
          ← Вернуться к списку кейсов
        </Link>
      </div>
    )
  }

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

      <div className={styles.headerCard}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.clientTag}>{caseItem.client}</div>
            <h1 className={styles.title}>{caseItem.title}</h1>
          </div>

          <div className={`${styles.statusBadge} ${styles[`status_${caseItem.status}`] || ''}`}>
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

      <div className={styles.stepsSection}>
        <h2 className={styles.sectionTitle}>Этапы создания кейса</h2>

        <div className={styles.stepsList}>
          <div className={styles.stepItem}>
            <div className={`${styles.stepNumber} ${styles.stepDone}`}>✓</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>1. Исходные материалы загружены</div>
              <div className={styles.stepDescription}>
                Формат: {caseItem.sourceType || 'аудио'}. Данные успешно приняты платформой.
              </div>
            </div>
          </div>

          <div className={styles.stepItem}>
            <div
              className={`${styles.stepNumber} ${
                caseItem.status === CASE_STATUS.PROCESSING ? styles.stepActive : styles.stepDone
              }`}
            >
              {caseItem.status === CASE_STATUS.PROCESSING ? '2' : '✓'}
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>2. AI-анализ и выделение ключевых метрик</div>
              <div className={styles.stepDescription}>
                {caseItem.status === CASE_STATUS.PROCESSING
                  ? 'Выполняется поиск твердых фактов и ключевых цитат...'
                  : 'Смыслы и цитаты верифицированы.'}
              </div>
            </div>
          </div>

          <div className={styles.stepItem}>
            <div
              className={`${styles.stepNumber} ${
                caseItem.status === CASE_STATUS.PUBLISHED
                  ? styles.stepDone
                  : caseItem.status === CASE_STATUS.REVIEW
                    ? styles.stepActive
                    : styles.stepPending
              }`}
            >
              {caseItem.status === CASE_STATUS.PUBLISHED ? '✓' : '3'}
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>
                3. Карточка и виджет социального доказательства
              </div>
              <div className={styles.stepDescription}>
                {caseItem.status === CASE_STATUS.PUBLISHED
                  ? 'Кейс опубликован и доступен по ссылке.'
                  : 'Готово к публикации и встраиванию на сайт.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.previewCard}>
        <h2 className={styles.sectionTitle}>Предпросмотр контента</h2>

        {caseItem.metric && (
          <div className={styles.metricBanner}>
            <span className={styles.metricValue}>{caseItem.metric}</span>
            <span className={styles.metricLabel}>{caseItem.metricLabel}</span>
          </div>
        )}

        {caseItem.quote && (
          <div className={styles.quoteBlock}>
            <p>«{caseItem.quote}»</p>
            {caseItem.author && <div className={styles.authorText}>— {caseItem.author}</div>}
          </div>
        )}

        {caseItem.summary && <p className={styles.stepDescription}>{caseItem.summary}</p>}
      </div>
    </div>
  )
}
