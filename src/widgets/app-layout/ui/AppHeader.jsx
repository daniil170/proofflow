import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import logoSvg from '@/assets/logo/proofflow-logo-horizontal-on-light.svg'
import styles from './AppHeader.module.css'

export const AppHeader = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const telegramSupportUrl =
    import.meta.env.VITE_TELEGRAM_SUPPORT_URL || 'https://t.me/proofflowbot'

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isMenuOpen])

  const handleLogout = async () => {
    setIsMenuOpen(false)
    await logout()
    navigate('/login')
  }

  const userInitial = (user?.displayName || user?.email || 'U').trim().charAt(0).toUpperCase()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brandGroup}>
          <Link to="/app" className={styles.logoLink} aria-label="ProofFlow App">
            <img
              src={logoSvg}
              alt="ProofFlow"
              className={styles.logoImage}
              width="130"
              height="25"
            />
          </Link>
          <span className={styles.betaBadge}>Бета</span>
        </div>

        <nav className={styles.nav} aria-label="Основное меню приложения">
          <NavLink
            to="/app"
            end
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Кейсы
          </NavLink>
          <NavLink
            to="/app/cases/new"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            + Новый кейс
          </NavLink>
          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Настройки
          </NavLink>
        </nav>

        <div className={styles.actionsGroup}>
          <a
            href={telegramSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.supportButton}
            aria-label="Написать нам в Telegram"
          >
            <svg
              className={styles.telegramIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
            </svg>
            <span>Написать нам</span>
          </a>

          <div className={styles.accountWrapper} ref={menuRef}>
            <button
              type="button"
              className={styles.accountButton}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Меню аккаунта"
              aria-expanded={isMenuOpen}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Пользователь'}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatar}>{userInitial}</div>
              )}
              <span className={styles.accountName}>
                {user?.displayName || user?.email || 'Аккаунт'}
              </span>
            </button>

            {isMenuOpen && (
              <div className={styles.menuDropdown} role="menu">
                <div className={styles.menuHeader}>
                  <div className={styles.menuUserName}>{user?.displayName || 'Пользователь'}</div>
                  <div className={styles.menuUserEmail}>{user?.email}</div>
                </div>

                <Link
                  to="/app/settings"
                  className={styles.menuItem}
                  onClick={() => setIsMenuOpen(false)}
                  role="menuitem"
                >
                  Настройки аккаунта
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={styles.menuItem}
                    onClick={() => setIsMenuOpen(false)}
                    role="menuitem"
                  >
                    Панель администратора
                  </Link>
                )}

                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.menuItemDanger}`}
                  onClick={handleLogout}
                  role="menuitem"
                >
                  Выйти из системы
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
