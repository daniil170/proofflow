import { Button, Container } from '@/shared/ui'
import { HERO_CONTENT } from '@/pages/landing'
import { CaseCard } from '@/widgets/case-card'
import { HERO_CASE_DATA } from '@/entities/case'
import styles from './Hero.module.css'

export const Hero = () => {
  const handleScrollToForm = () => {
    const target = document.getElementById('beta-form')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleScrollToSteps = () => {
    const target = document.getElementById('steps')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className={styles.heroSection} aria-labelledby="hero-title">
      <Container>
        <div className={styles.layout}>
          <div className={styles.contentCol}>
            <div className={styles.badge}>
              <span className={styles.badgeIcon} />
              <span>{HERO_CONTENT.badge}</span>
            </div>

            <h1 id="hero-title" className={styles.title}>
              {HERO_CONTENT.title}{' '}
              <span className={styles.titleHighlight}>{HERO_CONTENT.titleHighlight}</span>
            </h1>

            <p className={styles.subtitle}>{HERO_CONTENT.subtitle}</p>

            <div className={styles.buttonGroup}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleScrollToForm}
                aria-label="Записаться в закрытую бету"
              >
                {HERO_CONTENT.primaryButtonText}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleScrollToSteps}
                aria-label="Узнать как работает ProofFlow"
              >
                {HERO_CONTENT.secondaryButtonText}
              </Button>
            </div>
          </div>

          <div className={styles.visualCol} aria-hidden="true">
            <div className={styles.transcriptCard}>
              <div className={styles.transcriptHeader}>
                <span>{HERO_CONTENT.transcriptPreview.filename}</span>
                <div className={styles.transcriptMeta}>
                  <span>{HERO_CONTENT.transcriptPreview.duration}</span>
                  <span className={styles.statusReady}>
                    {HERO_CONTENT.transcriptPreview.status}
                  </span>
                </div>
              </div>

              <div className={styles.dialogueList}>
                {HERO_CONTENT.transcriptPreview.dialogue.map((item) => (
                  <div key={item.time} className={styles.dialogueItem}>
                    <span className={styles.timestamp}>{item.time}</span>
                    <span className={styles.dialogueText}>
                      <span className={styles.speakerLabel}>{item.speaker}:</span>
                      {item.isHighlighted ? (
                        <span className={styles.limeMark}>{item.text}</span>
                      ) : (
                        item.text
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.heroCaseCardWrapper}>
              <CaseCard variant="dark" data={HERO_CASE_DATA} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
