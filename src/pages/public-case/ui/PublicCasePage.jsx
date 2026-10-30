import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCaseRepository } from '@/shared/api'
import { CaseCard } from '@/widgets/case-card'
import logoSvg from '@/assets/logo/proofflow-logo-horizontal-on-light.svg'
import styles from './PublicCasePage.module.css'

export const PublicCasePage = () => {
  const { id } = useParams()
  const [caseItem, setCaseItem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    const repository = getCaseRepository()

    repository
      .getPublicCase(id)
      .then((item) => {
        if (!isMounted) return
        if (!item) {
          setError('Кейс недоступен или еще не опубликован')
        } else {
          setCaseItem(item)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err?.message || 'Не удалось загрузить кейс')
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id])

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.topBar}>
          <Link to="/" className={styles.logoLink} aria-label="ProofFlow">
            <img src={logoSvg} alt="ProofFlow" className={styles.logoImage} />
          </Link>
        </header>
        <div className={styles.stateBox}>
          <div className={styles.spinner} />
          <span>Загрузка кейса...</span>
        </div>
      </div>
    )
  }

  if (error || !caseItem) {
    return (
      <div className={styles.container}>
        <header className={styles.topBar}>
          <Link to="/" className={styles.logoLink} aria-label="ProofFlow">
            <img src={logoSvg} alt="ProofFlow" className={styles.logoImage} />
          </Link>
        </header>
        <div className={styles.stateBox}>
          <h2 className={styles.stateTitle}>Кейс недоступен</h2>
          <p className={styles.stateDesc}>
            Этот кейс не опубликован, был снят с публикации автором или указана неверная ссылка.
          </p>
          <Link to="/" className={styles.ctaLink}>
            ← На главную ProofFlow
          </Link>
        </div>
      </div>
    )
  }

  const cardData = {
    headline: caseItem.headline || '',
    title: caseItem.headline || caseItem.title || '',
    metric: caseItem.metric || '',
    metricLabel: caseItem.metricLabel || '',
    summaryRows: Array.isArray(caseItem.summaryRows) ? caseItem.summaryRows : [],
    before: caseItem.problem || '',
    done: caseItem.solution || '',
    after: caseItem.result || '',
    quote: caseItem.quote || '',
    author: (caseItem.author && caseItem.author !== 'Анна К.') ? caseItem.author : 'Клиент',
    authorRole: caseItem.authorRole || '',
    authorCompany: caseItem.authorCompany || '',
    company: caseItem.companyName || caseItem.branding?.companyName || '',
    messenger: caseItem.messenger || 'unknown',
    cardMessages: Array.isArray(caseItem.cardMessages) ? caseItem.cardMessages : [],
    chatMessages: Array.isArray(caseItem.cardMessages) ? caseItem.cardMessages : [],
    isVerifiedByChat: caseItem.isVerifiedByChat !== false,
    category: caseItem.tags?.[0] || '',
    accentColor: caseItem.branding?.accentColor || '#d6f94c',
    logoUrl: caseItem.branding?.showLogo ? caseItem.branding?.logoUrl : null,
  }

  const accentColor = caseItem.branding?.accentColor || '#d6f94c'

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <Link to="/" className={styles.logoLink} aria-label="ProofFlow">
          <img src={logoSvg} alt="ProofFlow" className={styles.logoImage} />
        </Link>
        <Link to="/" className={styles.ctaLink}>
          Создать свой кейс
        </Link>
      </header>

      <main className={styles.content}>
        <div className={styles.cardContainer} style={{ '--case-accent': accentColor }}>
          <CaseCard variant={caseItem.selectedVariant || 'dark'} data={cardData} />
        </div>

        <div className={styles.verifiedBadgeRow}>
          <span className={styles.verifiedTag}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Проверено по переписке
          </span>
          <span className={styles.verifiedNote}>
            Цитата и факты верифицированы оригинальной перепиской с клиентом
          </span>
        </div>

        <div className={styles.storyGrid}>
          <div className={styles.storyCol}>
            <span className={styles.storyLabel}>Было</span>
            <p className={styles.storyText}>{caseItem.problem}</p>
          </div>
          <div className={styles.storyCol}>
            <span className={styles.storyLabel}>Сделано</span>
            <p className={styles.storyText}>{caseItem.solution}</p>
          </div>
          <div className={`${styles.storyCol} ${styles.storyColHighlight}`}>
            <span className={`${styles.storyLabel} ${styles.storyLabelHighlight}`}>Стало</span>
            <p className={styles.storyText}>{caseItem.result}</p>
          </div>
        </div>

        <section className={styles.footerBanner}>
          <div>
            <div className={styles.bannerTitle}>Упаковано с помощью ProofFlow</div>
            <div className={styles.bannerText}>
              Превратите созвоны и переписки с клиентами в продающие кейсы за 2 минуты
            </div>
          </div>
          <Link to="/" className={styles.bannerButton}>
            Попробовать бесплатно
          </Link>
        </section>
      </main>
    </div>
  )
}
