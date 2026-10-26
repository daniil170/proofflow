import PropTypes from 'prop-types'
import styles from './NewspaperCard.module.css'

export const NewspaperCard = ({ data, className }) => {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      <h3 className={styles.masthead}>ВЕСТНИК КЕЙСОВ</h3>

      <div className={styles.doubleRule} aria-hidden="true">
        <div className={styles.ruleThick} />
        <div className={styles.ruleThin} />
      </div>

      <div className={styles.subBar}>
        <span>
          {data.category || 'SMM-стратегия'} · {data.company || 'онлайн-школа'}
        </span>
        {data.isVerifiedByChat && <span>Проверено по переписке</span>}
      </div>

      <div className={styles.ruleThin} aria-hidden="true" />

      <h4 className={styles.articleTitle}>
        {data.title || 'Стабильный поток заявок вместо случайных'}
      </h4>

      <div className={styles.articleBody}>
        <div className={styles.metricCol}>
          <span className={styles.metricNumber}>{data.metric}</span>
          <span className={styles.metricSub}>{data.metricLabel || 'новых заявок'}</span>
        </div>

        <div className={styles.verticalDivider} aria-hidden="true" />

        <div className={styles.stepsCol}>
          <div className={styles.stepItem}>
            <strong>Было.</strong>
            <span>{data.before}</span>
          </div>
          <div className={styles.stepItem}>
            <strong>Сделано.</strong>
            <span>{data.done}</span>
          </div>
          <div className={styles.stepItem}>
            <strong>Стало.</strong>
            <span>{data.after}</span>
          </div>
        </div>
      </div>

      <div className={styles.ruleThin} aria-hidden="true" />

      <div className={styles.quoteSection}>
        <span className={styles.quoteChevron} aria-hidden="true">
          «
        </span>
        <div className={styles.quoteContent}>
          <blockquote className={styles.quoteText}>{data.quote}</blockquote>
          <span className={styles.quoteAuthor}>
            — {data.author}, {data.company}
          </span>
        </div>
      </div>

      <div className={styles.ruleThin} aria-hidden="true" />

      <div className={styles.footer}>
        <span className={styles.powered}>POWERED BY PROOFFLOW</span>
      </div>
    </div>
  )
}

NewspaperCard.propTypes = {
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
