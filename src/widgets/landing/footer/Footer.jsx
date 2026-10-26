import { Link } from 'react-router-dom'
import { Container } from '@/shared/ui'
import logoSvg from '@/assets/logo/proofflow-logo-horizontal-on-light.svg'
import styles from './Footer.module.css'

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.inner}>
          <a href="#" className={styles.logoLink} aria-label="ProofFlow Home">
            <img
              src={logoSvg}
              alt="ProofFlow"
              className={styles.logoImage}
              width="120"
              height="24"
            />
          </a>

          <nav className={styles.legalNav} aria-label="Правовая информация">
            <Link to="/terms" className={styles.legalLink}>
              Условия
            </Link>
            <Link to="/privacy" className={styles.legalLink}>
              Конфиденциальность
            </Link>
            <Link to="/cookies" className={styles.legalLink}>
              Cookies
            </Link>
          </nav>

          <p className={styles.copyright}>© 2026 ProofFlow</p>
        </div>
      </Container>
    </footer>
  )
}
