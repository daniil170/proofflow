import { Container } from '@/shared/ui'
import { STEPS_CONTENT } from '@/pages/landing'
import styles from './Steps.module.css'

export const Steps = () => {
  return (
    <section id="steps" className={styles.stepsSection} aria-labelledby="steps-title">
      <Container>
        <div className={styles.headerRow}>
          <h2 id="steps-title" className={styles.title}>
            {STEPS_CONTENT.title}
          </h2>
          <p className={styles.subtitle}>{STEPS_CONTENT.subtitle}</p>
        </div>

        <div className={styles.stepsGrid}>
          {STEPS_CONTENT.items.map((step) => (
            <article key={step.number} className={styles.stepCard}>
              <span className={styles.stepNumber}>{step.number}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
