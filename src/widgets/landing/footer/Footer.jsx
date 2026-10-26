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

          <p className={styles.copyright}>© 2026 ProofFlow</p>
        </div>
      </Container>
    </footer>
  )
}
