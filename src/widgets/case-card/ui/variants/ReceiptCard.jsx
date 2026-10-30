import PropTypes from 'prop-types'
import { PoweredByProofFlow } from '../PoweredByProofFlow'
import styles from './ReceiptCard.module.css'

export const ReceiptCard = ({ data = {}, className }) => {
  const rows = Array.isArray(data.summaryRows) && data.summaryRows.length > 0
    ? data.summaryRows
    : [
        data.before ? { label: 'ЗАДАЧА', text: data.before } : null,
        data.done ? { label: 'РЕШЕНИЕ', text: data.done } : null,
        data.after ? { label: 'РЕЗУЛЬТАТ', text: data.after } : null,
      ].filter(Boolean)

  const companyLine = (data.company && data.company !== 'ProofFlow' && !data.company.toLowerCase().startsWith('клиент')) ? data.company : ''

  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.header}>
        <h4 className={styles.title}>ЧЕК ОТ КЛИЕНТА</h4>
        {companyLine && <span className={styles.subTitle}>{companyLine}</span>}
      </div>

      {rows.length > 0 && (
        <>
          <div className={styles.dashedRule} aria-hidden="true" />
          <div className={styles.itemsList}>
            {rows.map((row, idx) => (
              <div key={row.id || `${row.label}-${idx}`} className={styles.itemRow}>
                <span className={styles.itemKey}>{row.label.toUpperCase()}</span>
                <span className={styles.itemDots} aria-hidden="true" />
                <span className={styles.itemVal}>{row.text}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {data.quote && (
        <>
          <div className={styles.dashedRule} aria-hidden="true" />
          <div className={styles.reviewSection}>
            <span className={styles.reviewLabel}>ОТЗЫВ КЛИЕНТА:</span>
            <p className={styles.reviewText}>{data.quote}</p>
          </div>
        </>
      )}

      {data.metric && (
        <>
          <div className={styles.dashedRule} aria-hidden="true" />
          <div className={styles.totalBox}>
            <span className={styles.totalLabel}>ИТОГО</span>
            <span className={styles.totalValue}>{data.metric}</span>
          </div>
        </>
      )}

      <div className={styles.barcodeBlock}>
        <svg
          className={styles.barcodeSvg}
          viewBox="0 0 260 48"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="0" y="0" width="4" height="48" />
          <rect x="7" y="0" width="2" height="48" />
          <rect x="12" y="0" width="6" height="48" />
          <rect x="22" y="0" width="2" height="48" />
          <rect x="27" y="0" width="4" height="48" />
          <rect x="35" y="0" width="7" height="48" />
          <rect x="46" y="0" width="3" height="48" />
          <rect x="52" y="0" width="2" height="48" />
          <rect x="57" y="0" width="5" height="48" />
          <rect x="65" y="0" width="8" height="48" />
          <rect x="76" y="0" width="2" height="48" />
          <rect x="81" y="0" width="4" height="48" />
          <rect x="88" y="0" width="6" height="48" />
          <rect x="97" y="0" width="2" height="48" />
          <rect x="102" y="0" width="5" height="48" />
          <rect x="110" y="0" width="3" height="48" />
          <rect x="116" y="0" width="7" height="48" />
          <rect x="126" y="0" width="2" height="48" />
          <rect x="131" y="0" width="4" height="48" />
          <rect x="138" y="0" width="6" height="48" />
          <rect x="147" y="0" width="3" height="48" />
          <rect x="153" y="0" width="5" height="48" />
          <rect x="161" y="0" width="8" height="48" />
          <rect x="172" y="0" width="2" height="48" />
          <rect x="177" y="0" width="6" height="48" />
          <rect x="186" y="0" width="3" height="48" />
          <rect x="192" y="0" width="4" height="48" />
          <rect x="199" y="0" width="7" height="48" />
          <rect x="209" y="0" width="2" height="48" />
          <rect x="214" y="0" width="5" height="48" />
          <rect x="222" y="0" width="8" height="48" />
          <rect x="233" y="0" width="3" height="48" />
          <rect x="239" y="0" width="4" height="48" />
          <rect x="246" y="0" width="6" height="48" />
          <rect x="255" y="0" width="5" height="48" />
        </svg>
        {data.isVerifiedByChat && (
          <span className={styles.barcodeCaption}>ПРОВЕРЕНО ПО ПЕРЕПИСКЕ</span>
        )}
      </div>

      <div className={styles.footer}>
        <PoweredByProofFlow theme="light" iconSize={16} wordmarkHeight={11} />
      </div>
    </div>
  )
}

ReceiptCard.propTypes = {
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
