import PropTypes from 'prop-types'
import { Button } from '@/shared/ui'
import styles from './BetaSignupSuccess.module.css'

export const BetaSignupSuccess = ({ email, onReset }) => {
  return (
    <div className={styles.successWrapper} role="status" aria-live="polite">
      <div className={styles.iconCircle} aria-hidden="true">
        <svg
          className={styles.checkIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h3 className={styles.title}>Заявка успешно принята!</h3>

      <p className={styles.description}>
        Мы получили вашу заявку. В течение рабочего дня напишем вам на указанную почту, чтобы
        обсудить первый созвон и предоставить доступ.
      </p>

      {email && (
        <div className={styles.emailPill}>
          <span>Ответ придет на:</span>
          <strong>{email}</strong>
        </div>
      )}

      {onReset && (
        <div className={styles.actionWrapper}>
          <Button variant="secondary" size="sm" onClick={onReset}>
            Подать еще одну заявку
          </Button>
        </div>
      )}
    </div>
  )
}

BetaSignupSuccess.propTypes = {
  email: PropTypes.string,
  onReset: PropTypes.func,
}
