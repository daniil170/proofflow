import { Container } from '@/shared/ui'
import styles from './BetaProgramSection.module.css'

export const BetaProgramSection = () => {
  const handleCtaClick = (e) => {
    e.preventDefault()
    const target = document.getElementById('beta-form') || document.getElementById('apply-beta')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
      window.history.pushState(null, '', '#apply-beta')
    }
  }

  return (
    <section
      id="closed-beta-program"
      aria-labelledby="beta-program-title"
      className={styles.section}
    >
      <Container>
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <span className={styles.statusDot} />
            <span>ЗАКРЫТЫЙ БЕТА-ТЕСТ · FOUNDER-ONBOARDING</span>
          </div>
          <h2 id="beta-program-title" className={styles.title}>
            Как устроен закрытый бета-тест
          </h2>
          <p className={styles.subtitle}>
            Мы не отправляем вас разбираться в пустом кабинете в одиночку. Мы берем за руку, упаковываем ваши реальные отзывы в первые 15 минут и докручиваем инструмент под ваши задачи.
          </p>
        </div>

        <div className={`${styles.grid} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`}>
          <article className={styles.card}>
            <div>
              <div className={styles.cardTop}>
                <span className={styles.stepNumber}>01</span>
                <span className={styles.iconWrap}>
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="16"
                  >
                    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                    <rect height="12" rx="2" width="14" x="2" y="6" />
                  </svg>
                </span>
              </div>
              <h3 className={styles.cardTitle}>
                Шаг 1: 15 минут в Zoom — первый кейс «под ключ»
              </h3>
              <p className={styles.cardDetails}>
                Подключаемся вместе с фаундером. Вы приносите 1–2 реальных скриншота из Telegram или WhatsApp. Мы прямо на экране извлекаем смыслы, настраиваем NDA-блюр и за 2 минуты собираем готовый визуал под ваш стиль.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div>
              <div className={styles.cardTop}>
                <span className={styles.stepNumber}>02</span>
                <span className={styles.iconWrap}>
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="16"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </span>
              </div>
              <h3 className={styles.cardTitle}>
                Шаг 2: 7 дней полного безлимитного доступа
              </h3>
              <p className={styles.cardDetails}>
                Вы получаете закрытый доступ ко всем 4 форматам карточек (B2B Мини-кейс, Газета, B2C Чек, 9:16 Сторис). Упаковываете скопившиеся отзывы, публикуете в каналы, соцсети или вставляете на сайт.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div>
              <div className={styles.cardTop}>
                <span className={styles.stepNumber}>03</span>
                <span className={styles.iconWrap}>
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="16"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </span>
              </div>
              <h3 className={styles.cardTitle}>
                Шаг 3: Персональная прямая линия в Telegram
              </h3>
              <p className={styles.cardDetails}>
                Никаких ботов поддержки и тикетов. Отдельный чат с фаундерами: оперативно фиксим баги, правим промпты под вашу нишу и внедряем нужные вам фичи прямо во время спринта.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div>
              <div className={styles.cardTop}>
                <span className={styles.stepNumber}>04</span>
                <span className={styles.iconWrap}>
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="16"
                  >
                    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                    <circle cx="7.5" cy="7.5" fill="currentColor" r=".5" />
                  </svg>
                </span>
              </div>
              <h3 className={styles.cardTitle}>
                Шаг 4: Пожизненная скидка 50% для первых 10 участников
              </h3>
              <p className={styles.cardDetails}>
                В конце недели — короткий созвон на 10 минут. Если инструмент сэкономил вам часы работы — фиксируем за вами Founder-тариф с пожизненной скидкой 50% до официального релиза.
              </p>
            </div>
          </article>
        </div>

        <div className={styles.ctaBanner}>
          <div className={styles.ctaContent}>
            <div className={styles.ctaSeatRow}>
              <span className={styles.pulseWrapper}>
                <span className={styles.pulsePing} />
                <span className={styles.pulseDot} />
              </span>
              <span>
                Осталось мест в первой когорте:{' '}
                <strong className={styles.seatCount}>[10 / 10]</strong>
              </span>
            </div>
            <p className={styles.ctaRequirement}>
              Требование к участнику: наличие архива переписок/отзывов и готовность к 15-минутному звонку.
            </p>
          </div>
          <a
            className={styles.ctaButton}
            href="#apply-beta"
            role="link"
            onClick={handleCtaClick}
          >
            <span>Подать заявку на бета-тест</span>
            <svg
              aria-hidden="true"
              className={styles.buttonArrow}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </Container>
    </section>
  )
}

export default BetaProgramSection
