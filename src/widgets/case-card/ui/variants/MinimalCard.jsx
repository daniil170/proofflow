import PropTypes from 'prop-types'
import { PoweredByProofFlow } from '../PoweredByProofFlow'
import styles from './MinimalCard.module.css'

export const MinimalCard = ({ data = {}, className }) => {
  const authorName = (data.author && data.author.trim()) ? data.author.trim() : 'Клиент'

  const rows = Array.isArray(data.summaryRows) && data.summaryRows.length > 0
    ? data.summaryRows
    : [
        data.before ? { label: 'было', text: data.before } : null,
        data.done ? { label: 'сделано', text: data.done } : null,
        data.after ? { label: 'стало', text: data.after } : null,
      ].filter(Boolean)

  const companyLine = (data.company && data.company !== 'ProofFlow' && !data.company.toLowerCase().startsWith('клиент')) ? data.company : ''

  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.header}>
        <span>КЕЙС</span>
        {companyLine && <span>{companyLine}</span>}
      </div>

      <div className={styles.ruleThick} aria-hidden="true" />

      {data.metric && (
        <>
          <div className={styles.metricBlock}>
            <span className={styles.metricValue}>{data.metric}</span>
            {data.metricLabel && (
              <div className={styles.metricSubRow}>
                <div className={styles.redSquare} aria-hidden="true" />
                <span className={styles.metricLabel}>{data.metricLabel}</span>
              </div>
            )}
          </div>
          <div className={styles.ruleThin} aria-hidden="true" />
        </>
      )}

      {rows.length > 0 && (
        <>
          <div className={styles.rowsList}>
            {rows.map((row, idx) => {
              const isLast = idx === rows.length - 1
              const keyClass = isLast ? styles.rowKeyHighlight : styles.rowKey
              const valClass = isLast ? styles.rowValHighlight : styles.rowVal
              return (
                <div key={row.id || `${row.label}-${idx}`} className={styles.dataRow}>
                  <span className={keyClass}>{row.label.toLowerCase()}</span>
                  <span className={valClass}>{row.text}</span>
                </div>
              )
            })}
          </div>
          <div className={styles.ruleThin} aria-hidden="true" />
        </>
      )}

      {data.quote && (
        <>
          <blockquote className={styles.quote}>{data.quote}</blockquote>
          <div className={styles.ruleThin} aria-hidden="true" />
        </>
      )}

      <div className={styles.footer}>
        <span className={styles.author}>{authorName}</span>
        <PoweredByProofFlow theme="light" iconSize={16} wordmarkHeight={11} />
      </div>
    </div>
  )
}

MinimalCard.propTypes = {
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
  }),
  className: PropTypes.string,
}
