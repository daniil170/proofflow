import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useAdminApplications } from '@/features/admin-applications'
import styles from './AdminLayout.module.css'

export const AdminLayout = () => {
  const { user } = useAuth()
  const applicationsState = useAdminApplications()
  const { newCount } = applicationsState

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <div className={styles.brandGroup}>
            <Link to="/admin" className={styles.logoLink}>
              ProofFlow
            </Link>
            <span className={styles.adminBadge}>Admin</span>
          </div>

          <nav className={styles.nav} aria-label="Меню панели управления">
            <NavLink
              to="/admin/applications"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              <span>Заявки</span>
              {newCount > 0 && <span className={styles.newBadge}>{newCount}</span>}
            </NavLink>

            <NavLink
              to="/admin/analytics"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              <span>Аналитика</span>
            </NavLink>
          </nav>

          <div className={styles.actionsGroup}>
            <span className={styles.userEmail}>{user?.email || user?.displayName}</span>
            <Link to="/app" className={styles.backToAppLink}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>В сервис</span>
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet context={applicationsState} />
      </main>
    </div>
  )
}
