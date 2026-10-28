import { Link, Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader.jsx'
import styles from './AppLayout.module.css'

export const AppLayout = () => {
  return (
    <div className={styles.layout}>
      <AppHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <span>© 2026 ProofFlow</span>
        <div className={styles.footerLinks}>
          <Link to="/terms" className={styles.footerLink}>
            Условия
          </Link>
          <Link to="/privacy" className={styles.footerLink}>
            Конфиденциальность
          </Link>
          <Link to="/cookies" className={styles.footerLink}>
            Cookies
          </Link>
        </div>
      </footer>
    </div>
  )
}
