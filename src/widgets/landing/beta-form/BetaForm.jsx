import { BetaSignupForm } from '@/features'
import styles from './BetaForm.module.css'

export const BetaForm = () => {
  return (
    <div className={styles.formCard}>
      <BetaSignupForm />
    </div>
  )
}
