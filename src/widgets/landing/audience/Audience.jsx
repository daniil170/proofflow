import { Container } from '@/shared/ui'
import { HERO_CONTENT } from '@/pages/landing'
import styles from './Audience.module.css'

export const Audience = () => {
  return (
    <section className={styles.audienceBar} aria-label="Целевая аудитория">
      <Container>
        <div className={styles.inner}>
          <span className={styles.label}>{HERO_CONTENT.audienceLabel}</span>
          <div className={styles.tagList}>
            {HERO_CONTENT.audienceList.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
