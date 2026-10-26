import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoginForm, useAuth } from '@/features/auth'
import logoSvg from '@/assets/logo/proofflow-logo-horizontal-on-light.svg'
import styles from './LoginPage.module.css'

export const LoginPage = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/app', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <Link to="/" className={styles.logoLink} aria-label="На главную">
          <img src={logoSvg} alt="ProofFlow" className={styles.logoImage} width="130" height="26" />
        </Link>
        <Link to="/" className={styles.backLink}>
          ← На лендинг
        </Link>
      </header>

      <main className={styles.content}>
        <LoginForm />
      </main>
    </div>
  )
}
