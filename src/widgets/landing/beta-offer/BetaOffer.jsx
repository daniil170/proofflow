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
        <span className={styles.discountBadge}>{BETA_OFFER_CONTENT.termsNotice}</span>
      </p>

      <div className={styles.conditionsList}>
        <div className={styles.conditionItem}>
          <div className={styles.iconWrap}>
            <svg
              className={styles.conditionIcon}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className={styles.conditionTextWrap}>
            <span className={styles.conditionTitle}>Бесплатный доступ</span>
            <span className={styles.conditionText}>
              7 дней полного безлимитного доступа ко всем 4 форматам карточек и первый кейс «под
              ключ» вместе с фаундером за 15 минут в Zoom.
            </span>
          </div>
        </div>

        <div className={styles.conditionItem}>
          <div className={styles.iconWrap}>
            <svg
              className={styles.conditionIcon}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className={styles.conditionTextWrap}>
            <span className={styles.conditionTitle}>Лимиты беты</span>
            <span className={styles.conditionText}>
              Всего 10 мест в первой когорте, прямой контакт с фаундером в Telegram без ботов и
              тикетов.
            </span>
          </div>
        </div>

        <div className={styles.conditionItem}>
          <div className={styles.iconWrap}>
            <svg
              className={styles.conditionIcon}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className={styles.conditionTextWrap}>
            <span className={styles.conditionTitle}>Что взамен</span>
            <span className={styles.conditionText}>
              Архив переписок или отзывов, честный фидбек и 10-минутный созвон. Взамен — пожизненная
              скидка 50% (Founder-тариф).
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
