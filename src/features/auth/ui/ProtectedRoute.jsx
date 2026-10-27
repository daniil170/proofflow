import PropTypes from 'prop-types'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../model/useAuth.js'
import { WaitlistScreen } from './WaitlistScreen.jsx'
import { BlockedScreen } from './BlockedScreen.jsx'
import styles from './ProtectedRoute.module.css'

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, accessStatus, isOnboarded } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} role="status" aria-label="Загрузка" />
        <span className={styles.loadingText}>Проверка прав доступа...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (accessStatus === 'waitlist') {
    return <WaitlistScreen />
  }

  if (accessStatus === 'blocked') {
    return <BlockedScreen />
  }

  const isWelcomeRoute = location.pathname === '/app/welcome'
  if (!isOnboarded && !isWelcomeRoute) {
    return <Navigate to="/app/welcome" replace />
  }

  if (isOnboarded && isWelcomeRoute) {
    return <Navigate to="/app" replace />
  }

  return children ? children : <Outlet />
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
}
