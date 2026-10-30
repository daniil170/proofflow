import PropTypes from 'prop-types'
import { PoweredByProofFlow } from '../PoweredByProofFlow'
import styles from './WhatsAppCard.module.css'

export const WhatsAppCard = ({ data = {}, className }) => {
  const authorName = (data.author && data.author.trim()) ? data.author.trim() : 'Клиент'
  const isDefaultAuthor = authorName.toLowerCase() === 'клиент'
  const authorInitial = !isDefaultAuthor ? authorName.charAt(0).toUpperCase() : null

  const headline = data.headline || (data.title && !data.title.toLowerCase().startsWith('кейс для') ? data.title : '')

  const rows = Array.isArray(data.summaryRows) && data.summaryRows.length > 0
    ? data.summaryRows
    : [
        data.before ? { label: 'Задача', text: data.before } : null,
        data.done ? { label: 'Сделано', text: data.done } : null,
        data.after ? { label: 'Результат', text: data.after } : null,
      ].filter(Boolean)

  const rawMessages = Array.isArray(data.cardMessages) && data.cardMessages.length > 0
    ? data.cardMessages
    : (Array.isArray(data.chatMessages) ? data.chatMessages : [])

  const messages = rawMessages.slice(0, 3).map((m, idx) => {
    if (typeof m === 'string') {
      return { text: m, side: idx % 2 === 0 ? 'client' : 'me' }
    }
    return { text: m.text, side: m.side || 'client', time: m.time }
  })

  const messenger = data.messenger || 'unknown'
  const transcriptTitle = messenger === 'telegram'
    ? 'ОРИГИНАЛ · ПЕРЕПИСКА В TELEGRAM'
    : messenger === 'whatsapp'
    ? 'ОРИГИНАЛ · ПЕРЕПИСКА В WHATSAPP'
    : 'ОРИГИНАЛ · ПЕРЕПИСКА'

  const roleText = [data.authorRole, data.company || data.authorCompany]
    .filter(Boolean)
    .filter((v) => v !== 'Клиент' && v !== 'ProofFlow' && !v.toLowerCase().includes('кондитерск'))
    .join(' · ')

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

      {headline && (
        <div className={styles.highlightBox}>
          <h4 className={styles.highlightTitle}>{headline}</h4>
        </div>
      )}

      {rows.length > 0 && (
        <div className={styles.pillsList}>
          {rows.map((row, idx) => (
            <div key={row.id || `${row.label}-${idx}`} className={styles.pillRow}>
              <span className={styles.pillTag}>{row.label}</span>
              <span className={styles.pillContent}>{row.text}</span>
            </div>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <>
          <div className={styles.transcriptHeader}>{transcriptTitle}</div>
          <div className={styles.chatBox}>
            {messages.map((msg, idx) => {
              const isOutgoing = msg.side === 'me'
              const bubbleClass = isOutgoing ? styles.bubbleGreen : styles.bubbleGray
              return (
                <div key={idx} className={bubbleClass}>
                  {msg.text}
                </div>
              )
            })}
          </div>
        </>
      )}

      {data.quote && !messages.length && (
        <blockquote className={styles.quoteBlock}>«{data.quote}»</blockquote>
      )}

      <div className={styles.divider} />

      <div className={styles.footer}>
        <div className={styles.footerMetaRow}>
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
    messenger: PropTypes.string,
    cardMessages: PropTypes.arrayOf(PropTypes.any),
    chatMessages: PropTypes.arrayOf(PropTypes.any),
  }),
  className: PropTypes.string,
}
