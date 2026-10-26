import { useState } from 'react'
import { Container } from '@/shared/ui'
import { CaseCard } from '@/widgets/case-card'
import styles from './CaseStylesShowcase.module.css'

const STYLE_OPTIONS = [
  { id: 'dark', label: 'Тёмная' },
  { id: 'newspaper', label: 'Газета' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'receipt', label: 'Чек' },
  { id: 'minimal', label: 'Минимализм' },
]

export const CaseStylesShowcase = () => {
  const [selectedVariant, setSelectedVariant] = useState('dark')

  return (
    <section id="case-styles" className={styles.section} aria-labelledby="case-styles-title">
      <Container>
        <div className={styles.header}>
          <span className={styles.badge}>5 готовых стилей</span>
          <h2 id="case-styles-title" className={styles.title}>
            Выберите стиль
          </h2>
          <p className={styles.description}>
            Каждый кейс можно опубликовать в одном из пяти стилей: строгий минимализм, винтажная
            газета, чек, чат в мессенджере или тёмная карточка с акцентной метрикой.
          </p>
        </div>

        <div className={styles.tabsContainer}>
          <div className={styles.tabsList} role="tablist" aria-label="Стили карточек кейса">
            {STYLE_OPTIONS.map((option) => {
              const isActive = selectedVariant === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  id={`tab-${option.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${option.id}`}
                  className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
                  onClick={() => setSelectedVariant(option.id)}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <div
          id={`panel-${selectedVariant}`}
          role="tabpanel"
          aria-labelledby={`tab-${selectedVariant}`}
          className={styles.cardContainer}
        >
          <div className={styles.cardWrapper}>
            <CaseCard variant={selectedVariant} />
          </div>
        </div>

        <p className={styles.caption}>
          Карточки адаптивны: занимают ширину контейнера и отлично смотрятся на любых экранах.
        </p>
      </Container>
    </section>
  )
}
