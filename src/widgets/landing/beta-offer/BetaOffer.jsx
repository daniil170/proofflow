import { BETA_OFFER_CONTENT } from '@/pages/landing'
import styles from './BetaOffer.module.css'

export const BetaOffer = () => {
  return (
    <div className={styles.offerCol}>
      <h2 id="beta-offer-title" className={styles.title}>
        {BETA_OFFER_CONTENT.title}
      </h2>

      <p className={styles.description}>
        {BETA_OFFER_CONTENT.descriptionPrefix} <strong>{BETA_OFFER_CONTENT.priceNotice}</strong>{' '}
        <span>{BETA_OFFER_CONTENT.termsNotice}</span>
      </p>

      <div className={styles.conditionsList}>
        <div className={styles.conditionItem}>
          <svg
            className={styles.conditionIcon}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div className={styles.conditionTextWrap}>
            <span className={styles.conditionTitle}>Бесплатный доступ</span>
            <span className={styles.conditionText}>
              Полный доступ к транскрибации, сборке кейсов и виджету на весь период беты.
            </span>
          </div>
        </div>

        <div className={styles.conditionItem}>
          <svg
            className={styles.conditionIcon}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div className={styles.conditionTextWrap}>
            <span className={styles.conditionTitle}>Лимиты беты</span>
            <span className={styles.conditionText}>
              До 10 готовых кейсов на команду в месяц без скрытых платежей.
            </span>
          </div>
        </div>

        <div className={styles.conditionItem}>
          <svg
            className={styles.conditionIcon}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div className={styles.conditionTextWrap}>
            <span className={styles.conditionTitle}>Что взамен</span>
            <span className={styles.conditionText}>
              Честный отзыв и короткий 20-минутный созвон с фаундером после теста.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
