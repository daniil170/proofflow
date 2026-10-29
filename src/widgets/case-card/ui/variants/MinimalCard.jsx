import PropTypes from 'prop-types'
import { PoweredByProofFlow } from '../PoweredByProofFlow'
import styles from './MinimalCard.module.css'

export const MinimalCard = ({ data, className }) => {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.header}>
        <span>КЕЙС</span>
        <span>{data.company}</span>
      </div>

      <div className={styles.ruleThick} aria-hidden="true" />

      <div className={styles.metricBlock}>
        <span className={styles.metricValue}>{data.metric}</span>
        <div className={styles.metricSubRow}>
          <div className={styles.redSquare} aria-hidden="true" />
          <span className={styles.metricLabel}>{data.metricLabel}</span>
        </div>
      </div>

      <div className={styles.ruleThin} aria-hidden="true" />

      <div className={styles.rowsList}>
        <div className={styles.dataRow}>
          <span className={styles.rowKey}>было</span>
          <span className={styles.rowVal}>{data.before}</span>
        </div>
        <div className={styles.dataRow}>
          <span className={styles.rowKey}>сделано</span>
          <span className={styles.rowVal}>{data.done}</span>
        </div>
        <div className={styles.dataRow}>
          <span className={styles.rowKeyHighlight}>стало</span>
          <span className={styles.rowValHighlight}>{data.after}</span>
        </div>
      </div>

      <div className={styles.ruleThin} aria-hidden="true" />

      <blockquote className={styles.quote}>{data.quote}</blockquote>

      <div className={styles.ruleThin} aria-hidden="true" />

      <div className={styles.footer}>
        <span className={styles.author}>{data.author}</span>
        <PoweredByProofFlow theme="light" iconSize={16} wordmarkHeight={11} />
      </div>
    </div>
  )
}

MinimalCard.propTypes = {
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
  }).isRequired,
  className: PropTypes.string,
}
