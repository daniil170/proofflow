import PropTypes from 'prop-types'
import styles from './DarkCard.module.css'

export const DarkCard = ({ data, className }) => {
  const authorInitial = data.author ? data.author.charAt(0).toUpperCase() : 'M'

  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.header}>
        <span className={styles.category}>КЕЙС · {data.category || 'SMM-СТРАТЕГИЯ'}</span>
        {data.isVerifiedByChat && (
          <span className={styles.verified}>
            <svg
              className={styles.shieldIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Проверено по переписке
          </span>
        )}
      </div>

      <div className={styles.metricBlock}>
        <span className={styles.metricValue}>{data.metric}</span>
        <span className={styles.metricLabel}>{data.metricLabel}</span>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>было</span>
          <span className={styles.statText}>{data.before}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>сделано</span>
          <span className={styles.statText}>{data.done}</span>
        </div>
        <div className={styles.statBoxHighlight}>
          <span className={styles.statLabelHighlight}>стало</span>
          <span className={styles.statTextHighlight}>{data.after}</span>
        </div>
      </div>

      {(data.niche || data.channel || data.duration) && (
        <div className={styles.tagsRow}>
          {data.niche && <span className={styles.tag}>{data.niche}</span>}
          {data.channel && <span className={styles.tag}>{data.channel}</span>}
          {data.duration && <span className={styles.tag}>{data.duration}</span>}
        </div>
      )}

      <blockquote className={styles.quote}>{data.quote}</blockquote>

      <div className={styles.divider} />

      <div className={styles.footer}>
        <div className={styles.authorBlock}>
          <div className={styles.avatar} aria-hidden="true">
            {authorInitial}
          </div>
          <div className={styles.authorMeta}>
            <span className={styles.authorName}>
              {data.author}, {data.company}
            </span>
            <span className={styles.authorRole}>
              Клиент {data.category ? data.category.toLowerCase() : 'SMM-стратега'}
            </span>
          </div>
        </div>

        <div className={styles.brandBadge}>
          <div className={styles.checkIconBox} aria-hidden="true">
            <svg
              className={styles.checkIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span>
            Powered by <strong>ProofFlow</strong>
          </span>
        </div>
      </div>
    </div>
  )
}

DarkCard.propTypes = {
  data: PropTypes.shape({
    metric: PropTypes.string.isRequired,
    metricLabel: PropTypes.string.isRequired,
    before: PropTypes.string.isRequired,
    done: PropTypes.string.isRequired,
    after: PropTypes.string.isRequired,
    quote: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    isVerifiedByChat: PropTypes.bool.isRequired,
    title: PropTypes.string,
    category: PropTypes.string,
    niche: PropTypes.string,
    channel: PropTypes.string,
    duration: PropTypes.string,
  }).isRequired,
  className: PropTypes.string,
}
