import PropTypes from 'prop-types'
import { PoweredByProofFlow } from '../PoweredByProofFlow'
import styles from './WhatsAppCard.module.css'

export const WhatsAppCard = ({ data, className }) => {
  const authorInitial = data.author ? data.author.charAt(0).toUpperCase() : 'A'

  const messages =
    data.chatMessages && data.chatMessages.length > 0
      ? data.chatMessages
      : ['Это было невероятно вкусно!', data.quote.replace(/^[«"]/, '').replace(/[»"]$/, '')]

  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.topBadgeRow}>
        <span className={styles.clientBadge}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Отзыв клиента
        </span>
      </div>

      <div className={styles.highlightBox}>
        <h4 className={styles.highlightTitle}>
          {data.title || `${data.metric} ${data.metricLabel}`}
        </h4>
      </div>

      <div className={styles.pillsList}>
        <div className={styles.pillRow}>
          <span className={styles.pillTag}>Задача</span>
          <span className={styles.pillContent}>{data.before}</span>
        </div>
        <div className={styles.pillRow}>
          <span className={styles.pillTag}>Сомнение</span>
          <span className={styles.pillContent}>{data.done}</span>
        </div>
        <div className={styles.pillRow}>
          <span className={styles.pillTag}>Результат</span>
          <span className={styles.pillContent}>{data.after}</span>
        </div>
      </div>

      <div className={styles.transcriptHeader}>ОРИГИНАЛ · ПЕРЕПИСКА В WHATSAPP</div>

      <div className={styles.chatBox}>
        {messages[0] && <div className={styles.bubbleGray}>{messages[0]}</div>}
        {messages[1] && <div className={styles.bubbleGreen}>{messages[1]}</div>}
      </div>

      <div className={styles.divider} />

      <div className={styles.footer}>
        <div className={styles.footerMetaRow}>
          <div className={styles.authorBlock}>
            <div className={styles.avatar} aria-hidden="true">
              {authorInitial}
            </div>
            <div className={styles.authorMeta}>
              <span className={styles.authorName}>{data.author}</span>
              <span className={styles.authorRole}>Клиент {data.company || 'кондитерской'}</span>
            </div>
          </div>

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

        <div className={styles.poweredRow}>
          <PoweredByProofFlow theme="light" iconSize={16} wordmarkHeight={11} />
        </div>
      </div>
    </div>
  )
}

WhatsAppCard.propTypes = {
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
    chatMessages: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  className: PropTypes.string,
}
