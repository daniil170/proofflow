import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCaseRepository } from '@/shared/api'
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
      .getById(id)
      .then((item) => {
        if (!isMounted) return
        if (!item) {
          setError('Кейс не найден или еще не опубликован')
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
            <img
              src={logoSvg}
              alt="ProofFlow"
              className={styles.logoImage}
              width="130"
              height="24"
            />
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
            <img
              src={logoSvg}
              alt="ProofFlow"
              className={styles.logoImage}
              width="130"
              height="24"
            />
          </Link>
        </header>
        <div className={styles.stateBox}>
          <h2>{error || 'Кейс не найден'}</h2>
          <Link to="/" className={styles.ctaLink}>
            ← На главную
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <Link to="/" className={styles.logoLink} aria-label="ProofFlow">
          <img src={logoSvg} alt="ProofFlow" className={styles.logoImage} width="130" height="24" />
        </Link>
        <Link to="/" className={styles.ctaLink}>
          Создать свой кейс
        </Link>
      </header>

      <main className={styles.content}>
        <article className={styles.card}>
          <span className={styles.clientBadge}>{caseItem.client}</span>

          <h1 className={styles.title}>{caseItem.title}</h1>

          {caseItem.metric && (
            <div className={styles.metricBlock}>
              <span className={styles.metricValue}>{caseItem.metric}</span>
              <span className={styles.metricLabel}>{caseItem.metricLabel}</span>
            </div>
          )}

          {caseItem.quote && (
            <div className={styles.quoteCard}>
              <p>«{caseItem.quote}»</p>
              {caseItem.author && <div className={styles.author}>— {caseItem.author}</div>}
            </div>
          )}

          {caseItem.summary && <p className={styles.summary}>{caseItem.summary}</p>}
        </article>

        <section className={styles.footerBanner}>
          <div>
            <div className={styles.bannerTitle}>Упаковано с помощью ProofFlow</div>
            <div className={styles.bannerText}>
              Превратите созвоны с клиентами в продающие артефакты и виджеты за 1 минуту
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
