import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { CASE_STATUS, CASE_STATUS_LABELS, getCaseRepository } from '@/shared/api'
import styles from './CasesListPage.module.css'

export const CasesListPage = () => {
  const { user } = useAuth()
  const [cases, setCases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSeeding, setIsSeeding] = useState(false)

  const repository = useMemo(() => getCaseRepository(), [])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const unsubscribe = repository.subscribeByOwner(
      user.id,
      (items) => {
        setCases(items)
        setIsLoading(false)
        setError(null)
      },
      (err) => {
        setError(err?.message || 'Не удалось загрузить список кейсов')
        setIsLoading(false)
      }
    )

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [user?.id, repository])

  const handleSeedExamples = async () => {
    if (!user?.id) return
    setIsSeeding(true)
    setError(null)
    try {
      await repository.seedExamples(user.id)
    } catch (err) {
      setError(err?.message || 'Не удалось создать примеры кейсов')
    } finally {
      setIsSeeding(false)
    }
  }

  const filteredCases = useMemo(() => {
    if (statusFilter === 'all') {
      return cases
    }
    return cases.filter((item) => item.status === statusFilter)
  }, [cases, statusFilter])

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={styles.skeletonGrid}>
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      )
    }

    if (error) {
      return (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Повторить попытку
          </button>
        </div>
      )
    }

    if (cases.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📂</div>
          <h2 className={styles.emptyTitle}>У вас пока нет кейсов</h2>
          <p className={styles.emptyDescription}>
            Загрузите запись созвона, аудио или заметки, чтобы упаковать первый кейс, или посмотрите
            возможности платформы на готовых примерах.
          </p>
          <div className={styles.emptyActions}>
            <button
              type="button"
              className={styles.demoButton}
              onClick={handleSeedExamples}
              disabled={isSeeding}
            >
              {isSeeding ? 'Создание примеров...' : 'Попробовать на примере'}
            </button>
            <Link to="/app/cases/new" className={styles.secondaryButton}>
              + Создать кейс
            </Link>
          </div>
        </div>
      )
    }

    return (
      <>
        <div className={styles.filtersBar}>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === 'all' ? styles.filterChipActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Все ({cases.length})
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === CASE_STATUS.PROCESSING ? styles.filterChipActive : ''}`}
            onClick={() => setStatusFilter(CASE_STATUS.PROCESSING)}
          >
            Обработка ({cases.filter((c) => c.status === CASE_STATUS.PROCESSING).length})
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === CASE_STATUS.REVIEW ? styles.filterChipActive : ''}`}
            onClick={() => setStatusFilter(CASE_STATUS.REVIEW)}
          >
            На проверке ({cases.filter((c) => c.status === CASE_STATUS.REVIEW).length})
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === CASE_STATUS.DRAFT ? styles.filterChipActive : ''}`}
            onClick={() => setStatusFilter(CASE_STATUS.DRAFT)}
          >
            Черновик ({cases.filter((c) => c.status === CASE_STATUS.DRAFT).length})
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === CASE_STATUS.PUBLISHED ? styles.filterChipActive : ''}`}
            onClick={() => setStatusFilter(CASE_STATUS.PUBLISHED)}
          >
            Опубликован ({cases.filter((c) => c.status === CASE_STATUS.PUBLISHED).length})
          </button>
        </div>

        <div className={styles.grid}>
          {filteredCases.map((caseItem) => (
            <article key={caseItem.id} className={styles.card}>
              <div>
                <div className={styles.cardTop}>
                  <span className={styles.clientName}>{caseItem.client || 'Клиент'}</span>
                  <span
                    className={`${styles.statusBadge} ${styles[`status_${caseItem.status}`] || ''}`}
                  >
                    <span className={styles.statusDot} />
                    {CASE_STATUS_LABELS[caseItem.status] || caseItem.status}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>{caseItem.title}</h3>

                {caseItem.metric && (
                  <div className={styles.metricBox}>
                    <span className={styles.metricValue}>{caseItem.metric}</span>
                    <span className={styles.metricLabel}>{caseItem.metricLabel}</span>
                  </div>
                )}

                <p className={styles.cardSummary}>
                  {caseItem.summary || caseItem.quote || 'Обработка данных...'}
                </p>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.cardDate}>{formatDate(caseItem.createdAt)}</span>
                <div className={styles.cardActions}>
                  {caseItem.status === CASE_STATUS.PUBLISHED && (
                    <Link
                      to={`/c/${caseItem.id}`}
                      className={`${styles.actionLink} ${styles.actionPublic}`}
                      title="Публичная ссылка на кейс"
                    >
                      Смотреть ↗
                    </Link>
                  )}
                  <Link to={`/app/cases/${caseItem.id}`} className={styles.actionLink}>
                    Открыть процесс →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Мои кейсы</h1>
            {!isLoading && cases.length > 0 && (
              <span className={styles.countBadge}>{cases.length}</span>
            )}
          </div>
          <p className={styles.subtitle}>
            Управление артефактами, упакованными из созвонов и клиентских интервью
          </p>
        </div>

        <Link to="/app/cases/new" className={styles.createButton}>
          <span>+</span>
          <span>Новый кейс</span>
        </Link>
      </header>

      {renderContent()}
    </div>
  )
}
