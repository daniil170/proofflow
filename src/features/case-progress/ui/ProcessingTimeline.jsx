import PropTypes from 'prop-types'
import styles from './ProcessingTimeline.module.css'

const STAGE_ICONS = {
  preparing: '📁',
  transcribing: '🎙️',
  reading: '💬',
  analyzing: '🧠',
  verifying: '🛡️',
}

export const ProcessingTimeline = ({
  stages = [],
  isLongWait = false,
  status = 'processing',
}) => {
  return (
    <div className={styles.timelineContainer}>
      <ol className={styles.timelineList}>
        {stages.map((stage, index) => {
          const isCompleted = stage.status === 'completed'
          const isActive = stage.status === 'active'
          const isFailed = stage.status === 'failed'
          const isPending = stage.status === 'pending'
          const isLast = index === stages.length - 1

          return (
            <li key={stage.id} className={styles.timelineItem}>
              {!isLast && (
                <div
                  className={`${styles.connectorLine} ${
                    isCompleted ? styles.connectorLineDone : ''
                  }`}
                  aria-hidden="true"
                />
              )}

              <div className={styles.indicatorWrap}>
                <div
                  className={`
                    ${styles.indicator}
                    ${isCompleted ? styles.indicatorCompleted : ''}
                    ${isActive ? styles.indicatorActive : ''}
                    ${isFailed ? styles.indicatorFailed : ''}
                    ${isPending ? styles.indicatorPending : ''}
                  `}
                  aria-label={`${stage.label}: ${stage.status}`}
                >
                  {isCompleted && <span>✓</span>}
                  {isActive && <div className={styles.pulseRing} aria-hidden="true" />}
                  {isFailed && <span>✕</span>}
                  {isPending && <span>{index + 1}</span>}
                </div>
              </div>

              <div className={styles.content}>
                <div className={styles.labelRow}>
                  <span className={styles.stageIcon} aria-hidden="true">
                    {STAGE_ICONS[stage.id] || '⚡'}
                  </span>
                  <p
                    className={`
                      ${styles.label}
                      ${isActive ? styles.labelActive : ''}
                      ${isCompleted ? styles.labelCompleted : ''}
                      ${isFailed ? styles.labelFailed : ''}
                      ${isPending ? styles.labelPending : ''}
                    `}
                  >
                    {stage.label}
                  </p>
                  {isActive && <span className={styles.activeBadge}>В процессе</span>}
                </div>
                {stage.description && (
                  <p
                    className={`
                      ${styles.description}
                      ${isPending ? styles.descriptionPending : ''}
                    `}
                  >
                    {stage.description}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {isLongWait && status === 'processing' && (
        <div className={styles.longWaitBanner} role="status">
          <svg
            className={styles.longWaitIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p className={styles.longWaitText}>
            Обработка занимает чуть дольше обычного из-за детальной сверки материалов.
            Вы можете закрыть страницу — прогресс сохранится.
          </p>
        </div>
      )}

      <div className={styles.emailNoteCard}>
        <svg
          className={styles.mailIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <p className={styles.emailNoteText}>
          Можно закрыть вкладку, ссылка на готовый кейс придёт на почту
        </p>
      </div>
    </div>
  )
}

ProcessingTimeline.propTypes = {
  stages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      status: PropTypes.oneOf(['completed', 'active', 'pending', 'failed'])
        .isRequired,
    })
  ),
  isLongWait: PropTypes.bool,
  status: PropTypes.string,
}
