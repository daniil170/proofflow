import PropTypes from 'prop-types'
import { PoweredByProofFlow } from '../PoweredByProofFlow'
import styles from './DarkCard.module.css'

export const DarkCard = ({ data = {}, className }) => {
  const authorName = (data.author && data.author.trim()) ? data.author.trim() : 'Клиент'
  const isDefaultAuthor = authorName.toLowerCase() === 'клиент'
  const authorInitial = !isDefaultAuthor ? authorName.charAt(0).toUpperCase() : null

  const rows = Array.isArray(data.summaryRows) && data.summaryRows.length > 0
    ? data.summaryRows
    : [
        data.before ? { label: 'было', text: data.before } : null,
        data.done ? { label: 'сделано', text: data.done } : null,
        data.after ? { label: 'стало', text: data.after } : null,
      ].filter(Boolean)

  const roleText = [data.authorRole, data.company || data.authorCompany]
    .filter(Boolean)
    .filter((v) => v !== 'Клиент' && v !== 'ProofFlow' && !v.toLowerCase().includes('клиент'))
    .join(' · ')

  const headline = data.headline || (data.title && !data.title.toLowerCase().startsWith('кейс для') ? data.title : '')

  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.header}>
        <span className={styles.category}>
          {data.category ? `КЕЙС · ${data.category.toUpperCase()}` : 'КЕЙС'}
        </span>
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

      {data.metric ? (
        <div className={styles.metricBlock}>
          <span className={styles.metricValue}>{data.metric}</span>
          {data.metricLabel && <span className={styles.metricLabel}>{data.metricLabel}</span>}
        </div>
      ) : headline ? (
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel} style={{ fontSize: '18px', color: '#ffffff', fontWeight: 800 }}>
            {headline}
          </span>
        </div>
      ) : null}

      {rows.length > 0 && (
        <div className={styles.statsGrid}>
          {rows.map((row, idx) => {
            const isLast = idx === rows.length - 1
            const boxClass = isLast ? styles.statBoxHighlight : styles.statBox
            const labelClass = isLast ? styles.statLabelHighlight : styles.statLabel
            const textClass = isLast ? styles.statTextHighlight : styles.statText
            return (
              <div key={row.id || `${row.label}-${idx}`} className={boxClass}>
                <span className={labelClass}>{row.label.toLowerCase()}</span>
                <span className={textClass}>{row.text}</span>
              </div>
            )
          })}
        </div>
      )}

      {(data.niche || data.channel || data.duration) && (
        <div className={styles.tagsRow}>
          {data.niche && <span className={styles.tag}>{data.niche}</span>}
          {data.channel && <span className={styles.tag}>{data.channel}</span>}
          {data.duration && <span className={styles.tag}>{data.duration}</span>}
        </div>
      )}

      {data.quote && <blockquote className={styles.quote}>{data.quote}</blockquote>}

      <div className={styles.divider} />

      <div className={styles.footer}>
        <div className={styles.authorBlock}>
          <div className={styles.avatar} aria-hidden="true">
            {authorInitial || (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          <div className={styles.authorMeta}>
            <span className={styles.authorName}>{authorName}</span>
            {roleText && <span className={styles.authorRole}>{roleText}</span>}
          </div>
        </div>

        <PoweredByProofFlow theme="dark" iconSize={18} wordmarkHeight={12} />
      </div>
    </div>
  )
}

DarkCard.propTypes = {
  data: PropTypes.shape({
    headline: PropTypes.string,
    metric: PropTypes.string,
    metricLabel: PropTypes.string,
    before: PropTypes.string,
    done: PropTypes.string,
    after: PropTypes.string,
    summaryRows: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        origin: PropTypes.string,
      })
    ),
    quote: PropTypes.string,
    author: PropTypes.string,
    authorRole: PropTypes.string,
    authorCompany: PropTypes.string,
    company: PropTypes.string,
    isVerifiedByChat: PropTypes.bool,
    title: PropTypes.string,
    category: PropTypes.string,
    niche: PropTypes.string,
    channel: PropTypes.string,
    duration: PropTypes.string,
  }),
  className: PropTypes.string,
}
