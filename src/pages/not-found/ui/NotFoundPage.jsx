import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui'
import styles from './NotFoundPage.module.css'

export const NotFoundPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>Страница не найдена</h1>
        <p className={styles.description}>
          Запрошенная страница не существует или была перемещена. Проверьте правильность адреса.
        </p>
        <Link to="/" style={{ textDecoration: 'none' }} className={styles.linkBtn}>
          <Button variant="primary" size="large">
            Вернуться на главную
          </Button>
        </Link>
      </div>
    </div>
  )
}
