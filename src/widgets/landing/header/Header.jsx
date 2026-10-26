import { Link } from 'react-router-dom'
import { Button, Container } from '@/shared/ui'
import logoSvg from '@/assets/logo/proofflow-logo-horizontal-on-light.svg'
import styles from './Header.module.css'

export const Header = () => {
  const handleScrollToForm = () => {
    const target = document.getElementById('beta-form')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className={styles.header}>
      <Container>
        <div className={styles.inner}>
          <a href="#" className={styles.logoLink} aria-label="ProofFlow Home">
            <img
              src={logoSvg}
              alt="ProofFlow"
              className={styles.logoImage}
              width="144"
              height="28"
            />
          </a>

          <nav className={styles.nav} aria-label="Главная навигация">
            <a href="#steps" className={styles.navLink}>
              Как работает
            </a>
            <a href="#trust" className={styles.navLink}>
              Виджет
            </a>
            <a href="#comparison" className={styles.navLink}>
              Цены
            </a>
          </nav>

          <div className={styles.actionGroup}>
            <Link to="/login" className={styles.loginLink}>
              Войти
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={handleScrollToForm}
              aria-label="Перейти к форме подачи заявки в бету"
            >
              Попасть в бету
            </Button>
          </div>
        </div>
      </Container>
    </header>
  )
}
