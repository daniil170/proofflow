import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { ProcessingTimeline } from './ProcessingTimeline.jsx'
import styles from './ProcessingScreen.module.css'

export const ProcessingScreen = ({ progressState }) => {
  const {
    caseItem,
    isLoading,
    status,
    failReason,
    stages,
    isLongWait,
    isRetrying,
    retryProcessing,
  } = progressState

  const telegramSupportUrl =
    import.meta.env.VITE_TELEGRAM_SUPPORT_URL || 'https://t.me/proofflowbot'

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner} aria-hidden="true" />
          <p>Загрузка данных кейса...</p>
        </div>
      </div>
    )
  }

  const isFailed = status === 'failed'
  const clientLabel = caseItem?.clientLabel || caseItem?.client || 'Новый кейс'

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Link to="/app" className={styles.backLink}>
          ← К списку кейсов
        </Link>
      </div>

      <header className={styles.headerCard}>
        <div className={styles.headerRow}>
          <div>
            <span className={styles.clientBadge}>{clientLabel}</span>
            <h1 className={styles.title}>
              {isFailed ? 'Обработка остановлена' : 'Собираем черновик кейса'}
            </h1>
            <p className={styles.subtitle}>
              {isFailed
                ? 'Во время обработки возникла ошибка. Вы можете повторить попытку'
                : 'Искусственный интеллект анализирует переписку и аудиозаписи без выдумок'}
            </p>
          </div>

          <div
            className={`
              ${styles.statusBadge}
              ${isFailed ? styles.statusBadgeFailed : ''}
            `}
          >
            <span className={styles.statusDot} aria-hidden="true" />
            <span>{isFailed ? 'Ошибка' : 'В обработке'}</span>
          </div>
        </div>
      </header>

      {isFailed && (
        <section className={styles.failedAlertCard} aria-live="polite">
          <div className={styles.failedHeader}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Причина остановки:</span>
          </div>
          <p className={styles.failedReason}>
            {failReason || 'Не удалось завершить распознавание и анализ материалов.'}
          </p>

          <div className={styles.failedActions}>
            <button
              type="button"
              className={styles.retryButton}
              onClick={retryProcessing}
              disabled={isRetrying}
            >
              {isRetrying ? 'Перезапуск...' : 'Попробовать снова'}
            </button>

            <a
              href={telegramSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.supportButton}
            >
              <span>Написать нам</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      )}

      <main className={styles.mainCard}>
        <ProcessingTimeline
          stages={stages}
          isLongWait={isLongWait}
          status={status}
        />
      </main>
    </div>
  )
}

ProcessingScreen.propTypes = {
  progressState: PropTypes.shape({
    caseItem: PropTypes.object,
    isLoading: PropTypes.bool,
    status: PropTypes.string,
    failReason: PropTypes.string,
    stages: PropTypes.array,
    isLongWait: PropTypes.bool,
    isRetrying: PropTypes.bool,
    retryProcessing: PropTypes.func.isRequired,
  }).isRequired,
}
