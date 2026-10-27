import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getConsentGateway } from '@/shared/api'
import { CaseCard } from '@/widgets/case-card'
import logoSvg from '@/assets/logo/proofflow-logo-horizontal-on-light.svg'
import styles from './ConsentPage.module.css'

export const ConsentPage = () => {
  const { token } = useParams()
  const [consentData, setConsentData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [decision, setDecision] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    const gateway = getConsentGateway()

    gateway
      .getConsentByToken(token)
      .then((res) => {
        if (!isMounted) return
        setConsentData(res)
        if (res.status === 'approved' || res.status === 'declined') {
          setDecision(res.status)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err?.message || 'Не удалось загрузить данные согласия')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [token])

  const handleSubmit = async (choice) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const gateway = getConsentGateway()
      await gateway.submitClientConsent(token, choice)
      setDecision(choice)
    } catch (err) {
      setError(err?.message || 'Не удалось отправить решение')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.topBar}>
          <Link to="/" aria-label="ProofFlow">
            <img src={logoSvg} alt="ProofFlow" className={styles.logoImage} />
          </Link>
        </header>
        <main className={styles.main}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>Загрузка формы согласия...</div>
        </main>
      </div>
    )
  }

  if (error && !consentData) {
    return (
      <div className={styles.container}>
        <header className={styles.topBar}>
          <Link to="/" aria-label="ProofFlow">
            <img src={logoSvg} alt="ProofFlow" className={styles.logoImage} />
          </Link>
        </header>
        <main className={styles.main}>
          <div className={styles.decisionBox}>
            <h2 className={styles.decisionTitle}>{error || 'Запрос на согласие не найден'}</h2>
            <p className={styles.decisionDesc}>Ссылка устарела или указана некорректно.</p>
          </div>
        </main>
      </div>
    )
  }

  const anonCase = consentData?.anonymizedCase || {}
  const cardData = {
    metric: anonCase.metric || '+40%',
    metricLabel: anonCase.metricLabel || 'рост конверсии',
    before: anonCase.problem || 'Клиент терял заявки',
    done: anonCase.solution || 'Внедрили новое решение',
    after: anonCase.result || 'Увеличили продажи',
    quote: anonCase.quote || 'Отличный результат!',
    author: anonCase.author || 'Анна К.',
    company: anonCase.company || 'ProofFlow',
    isVerifiedByChat: true,
    category: 'КЕЙС',
  }

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <Link to="/" aria-label="ProofFlow">
          <img src={logoSvg} alt="ProofFlow" className={styles.logoImage} />
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.introBox}>
          <h1 className={styles.title}>Согласование кейса</h1>
          <p className={styles.subtitle}>
            Исполнитель подготовил черновик кейса на основе результатов вашей совместной работы. Личные данные обезличены.
          </p>
        </div>

        <div className={styles.caseCardBox}>
          <CaseCard variant="dark" data={cardData} />
        </div>

        <div className={styles.decisionBox}>
          {decision === 'approved' ? (
            <div className={`${styles.submittedBox} ${styles.submittedApproved}`}>
              <h3 className={styles.submittedTitle}>✓ Согласие подтверждено</h3>
              <p className={styles.submittedText}>
                Спасибо! Ваше решение зафиксировано. Исполнитель сможет опубликовать этот кейс.
              </p>
            </div>
          ) : decision === 'declined' ? (
            <div className={`${styles.submittedBox} ${styles.submittedDeclined}`}>
              <h3 className={styles.submittedTitle}>✕ Вы отклонили публикацию</h3>
              <p className={styles.submittedText}>
                Ваше решение зафиксировано. Кейс не будет опубликован.
              </p>
            </div>
          ) : (
            <>
              <h3 className={styles.decisionTitle}>Вы согласны на публикацию этого кейса?</h3>
              <p className={styles.decisionDesc}>
                Кейс может быть размещен на сайте исполнителя и в портфолио в обезличенном виде.
              </p>
              <div className={styles.buttonsRow}>
                <button
                  type="button"
                  className={styles.approveBtn}
                  onClick={() => handleSubmit('approved')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Отправка...' : 'Согласен на публикацию'}
                </button>
                <button
                  type="button"
                  className={styles.declineBtn}
                  onClick={() => handleSubmit('declined')}
                  disabled={isSubmitting}
                >
                  Не согласен
                </button>
              </div>
              {error && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{error}</span>}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
