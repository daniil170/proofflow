import { Container } from '@/shared/ui'
import { TRUST_CONTENT } from '@/pages/landing'
import styles from './Trust.module.css'

export const Trust = () => {
  return (
    <section id="trust" className={styles.trustSection} aria-labelledby="trust-title">
      <Container>
        <div className={styles.layout}>
          <div className={styles.contentCol}>
            <span className={styles.badge}>{TRUST_CONTENT.badge}</span>

            <h2 id="trust-title" className={styles.title}>
              {TRUST_CONTENT.title}
            </h2>

            <p className={styles.description}>{TRUST_CONTENT.description}</p>

            <div className={styles.codeBox}>
              <code>{TRUST_CONTENT.embedCodeSnippet}</code>
            </div>
          </div>

          <div className={styles.visualCol}>
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <span>{TRUST_CONTENT.widgetPreview.headerNote}</span>
                <span className={styles.exampleBadge}>{TRUST_CONTENT.widgetPreview.badge}</span>
              </div>

              <blockquote className={styles.quote}>{TRUST_CONTENT.widgetPreview.quote}</blockquote>

              <div className={styles.authorRow}>
                <div className={styles.avatar} aria-hidden="true">
                  PF
                </div>
                <div className={styles.authorMeta}>
                  <span className={styles.authorName}>
                    {TRUST_CONTENT.widgetPreview.author.name}
                  </span>
                  <span className={styles.authorRole}>
                    {TRUST_CONTENT.widgetPreview.author.roleAndCompany}
                  </span>
                </div>
              </div>

              <div className={styles.widgetFooter}>
                <button
                  type="button"
                  className={styles.listenButton}
                  aria-label="Послушать фрагмент записи на 35 минуте 48 секунде"
                >
                  <svg
                    className={styles.playIcon}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>{TRUST_CONTENT.widgetPreview.listenActionText}</span>
                </button>

                <div className={styles.verifiedBadge}>
                  <span className={styles.lightning} aria-hidden="true">
                    ⚡
                  </span>
                  <span>{TRUST_CONTENT.widgetPreview.verifiedBadgeText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
