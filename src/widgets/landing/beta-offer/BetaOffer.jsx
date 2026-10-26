import { Container } from '@/shared/ui'
import { BETA_OFFER_CONTENT } from '@/pages/landing'
import styles from './BetaOffer.module.css'

export const BetaOffer = () => {
  return (
    <section id="beta-offer" className={styles.offerSection} aria-labelledby="beta-offer-title">
      <Container>
        <div className={styles.content}>
          <h2 id="beta-offer-title" className={styles.title}>
            {BETA_OFFER_CONTENT.title}
          </h2>

          <p className={styles.description}>
            {BETA_OFFER_CONTENT.descriptionPrefix} <strong>{BETA_OFFER_CONTENT.priceNotice}</strong>{' '}
            <span>{BETA_OFFER_CONTENT.termsNotice}</span>
          </p>

          <div className={styles.conditionsGrid}>
            <div className={styles.conditionCard}>
              <h3 className={styles.conditionTitle}>Бесплатный доступ</h3>
              <p className={styles.conditionText}>
                Полный доступ к функциям транскрибации, сборки кейсов и виджету на весь период беты.
              </p>
            </div>

            <div className={styles.conditionCard}>
              <h3 className={styles.conditionTitle}>Лимиты беты</h3>
              <p className={styles.conditionText}>
                До 10 готовых упакованных кейсов и созвонов на команду в месяц без скрытых платежей.
              </p>
            </div>

            <div className={styles.conditionCard}>
              <h3 className={styles.conditionTitle}>Что взамен</h3>
              <p className={styles.conditionText}>
                Честный фидбек по результатам использования и короткое 20-минутное интервью с
                фаундером.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
