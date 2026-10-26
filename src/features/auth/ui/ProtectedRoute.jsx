import PropTypes from 'prop-types'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../model/useAuth.js'
import styles from './ProtectedRoute.module.css'

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} role="status" aria-label="Загрузка" />
        <span className={styles.loadingText}>Проверка авторизации...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children ? children : <Outlet />
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
}
