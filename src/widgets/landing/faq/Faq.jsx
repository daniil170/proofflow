import { useState } from 'react'
import { Container } from '@/shared/ui'
import { FAQ_CONTENT } from '@/pages/landing'
import styles from './Faq.module.css'

export const Faq = () => {
  const [openId, setOpenId] = useState(FAQ_CONTENT.items[0]?.id || '')

  const toggleItem = (id) => {
    setOpenId((prev) => (prev === id ? '' : id))
  }

  return (
    <section id="faq" className={styles.faqSection} aria-labelledby="faq-title">
      <Container>
        <div className={styles.layout}>
          <div className={styles.headerCol}>
            <span className={styles.badge}>Вопросы и ответы</span>
            <h2 id="faq-title" className={styles.title}>
              {FAQ_CONTENT.title}
            </h2>
            <p className={styles.subtitle}>
              Всё о конфиденциальности данных, поддержке языков и форматах загружаемых записей.
            </p>
          </div>

          <div className={styles.accordionList} role="region">
            {FAQ_CONTENT.items.map((item) => {
              const isOpen = openId === item.id
              const questionId = `faq-q-${item.id}`
              const panelId = `faq-p-${item.id}`

              return (
                <div key={item.id} className={styles.item}>
                  <h3>
                    <button
                      type="button"
                      id={questionId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className={styles.trigger}
                      onClick={() => toggleItem(item.id)}
                    >
                      <span>{item.question}</span>
                      <span
                        className={`${styles.iconWrapper} ${isOpen ? styles.iconOpen : ''}`}
                        aria-hidden="true"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M8 3v10M3 8h10" />
                        </svg>
                      </span>
                    </button>
                  </h3>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={questionId}
                    className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
                  >
                    <div className={styles.panelInner}>
                      <p className={styles.answerText}>{item.answer}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Container>
    </section>
  )
}
