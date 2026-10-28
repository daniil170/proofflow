import { useRouteError, Link } from 'react-router-dom'
import { Button } from '../button'
import styles from './AppErrorBoundary.module.css'

export const AppErrorBoundary = () => {
  const error = useRouteError()

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'Произошла непредвиденная ошибка при загрузке страницы.'

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="48"
            height="48"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className={styles.title}>Что-то пошло не так</h1>
        <p className={styles.description}>{errorMessage}</p>
        <div className={styles.actions}>
          <Button variant="primary" size="medium" onClick={handleReload}>
            Попробовать снова
          </Button>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="outline" size="medium">
              На главную
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
