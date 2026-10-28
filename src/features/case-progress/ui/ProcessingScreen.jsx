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
  const progressPercent = Math.min(
    100,
    Math.max(12, caseItem?.stageProgress || (status === 'processing' ? 25 : 100))
  )

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

      {!isFailed && (
        <section className={styles.synthesisCanvas} aria-label="Синтез кейса нейросетью">
          <div className={styles.orbContainer}>
            <div className={styles.glowBackdrop} />
            <div className={styles.outerOrbitRing} />
            <div className={styles.innerOrbitRing} />
            <div className={styles.radarSweep} />
            <div className={styles.coreOrb}>
              <div className={styles.coreSparkle}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.progressHud}>
            <div className={styles.hudMetaRow}>
              <span className={styles.hudLabel}>
                <span className={styles.hudDot} />
                Мультимодальный анализ ProofFlow AI
              </span>
              <span className={styles.hudPercent}>{progressPercent}%</span>
            </div>

            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progressPercent}%` }}
              >
                <div className={styles.progressBarGlow} />
              </div>
            </div>

            <div className={styles.terminalBox}>
              <span className={styles.terminalPrompt}>AI &gt;</span>
              <span className={styles.terminalMsg}>
                {caseItem?.stageMessage || 'Обработка и синтез материалов проекта...'}
              </span>
              <span className={styles.terminalCursor}>_</span>
            </div>
          </div>
        </section>
      )}

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
