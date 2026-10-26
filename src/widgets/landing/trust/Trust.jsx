import { Container } from '@/shared/ui'
import { TRUST_CONTENT } from '@/pages/landing'
import { CaseCard } from '@/widgets/case-card'
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
            <CaseCard variant="dark" />
          </div>
        </div>
      </Container>
    </section>
  )
}
