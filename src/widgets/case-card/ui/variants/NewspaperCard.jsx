import PropTypes from 'prop-types'
import { PoweredByProofFlow } from '../PoweredByProofFlow'
import styles from './NewspaperCard.module.css'

export const NewspaperCard = ({ data = {}, className }) => {
  const authorName = (data.author && data.author.trim()) ? data.author.trim() : 'Клиент'

  const subBarText = [data.category, data.company || data.authorCompany]
    .filter(Boolean)
    .filter((v) => v !== 'Клиент' && v !== 'ProofFlow')
    .join(' · ')

  const headline = data.headline || (data.title && !data.title.toLowerCase().startsWith('кейс для') ? data.title : '')

  const rows = Array.isArray(data.summaryRows) && data.summaryRows.length > 0
    ? data.summaryRows
    : [
        data.before ? { label: 'Было', text: data.before } : null,
        data.done ? { label: 'Сделано', text: data.done } : null,
        data.after ? { label: 'Стало', text: data.after } : null,
      ].filter(Boolean)

  const hasBody = Boolean(data.metric || rows.length > 0)

  return (
    <div className={`${styles.card} ${className || ''}`}>
      <h3 className={styles.masthead}>ВЕСТНИК КЕЙСОВ</h3>

      <div className={styles.doubleRule} aria-hidden="true">
        <div className={styles.ruleThick} />
        <div className={styles.ruleThin} />
      </div>

      {(subBarText || data.isVerifiedByChat) && (
        <div className={styles.subBar}>
          {subBarText ? <span>{subBarText}</span> : <span />}
          {data.isVerifiedByChat && <span>Проверено по переписке</span>}
        </div>
      )}

      {(subBarText || data.isVerifiedByChat) && (
        <div className={styles.ruleThin} aria-hidden="true" />
      )}

      {headline && <h4 className={styles.articleTitle}>{headline}</h4>}

      {hasBody && (
        <div className={styles.articleBody}>
          {data.metric ? (
            <div className={styles.metricCol}>
              <span className={styles.metricNumber}>{data.metric}</span>
              {data.metricLabel && <span className={styles.metricSub}>{data.metricLabel}</span>}
            </div>
          ) : null}

          {data.metric && rows.length > 0 && (
            <div className={styles.verticalDivider} aria-hidden="true" />
          )}

          {rows.length > 0 && (
            <div className={styles.stepsCol}>
              {rows.map((row, idx) => (
                <div key={row.id || `${row.label}-${idx}`} className={styles.stepItem}>
                  <strong>{row.label}.</strong>
                  <span>{row.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data.quote && (
        <>
          <div className={styles.ruleThin} aria-hidden="true" />
          <div className={styles.quoteSection}>
            <span className={styles.quoteChevron} aria-hidden="true">
              «
            </span>
            <div className={styles.quoteContent}>
              <blockquote className={styles.quoteText}>{data.quote}</blockquote>
              <span className={styles.quoteAuthor}>
                — {authorName}
              </span>
            </div>
          </div>
        </>
      )}

      <div className={styles.ruleThin} aria-hidden="true" />

      <div className={styles.footer}>
        <PoweredByProofFlow
          theme="newspaper"
          uppercase={true}
          iconSize={16}
          wordmarkHeight={11}
        />
      </div>
    </div>
  )
}

NewspaperCard.propTypes = {
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
