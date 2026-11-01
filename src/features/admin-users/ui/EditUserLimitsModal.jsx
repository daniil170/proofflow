import { useState } from 'react'
import PropTypes from 'prop-types'
import styles from './EditUserLimitsModal.module.css'

export const EditUserLimitsModal = ({ user, isOpen, onClose, onSave }) => {
  if (!isOpen || !user) return null

  const [caseLimit, setCaseLimit] = useState(
    typeof user.caseLimit === 'number' ? user.caseLimit : 3
  )
  const [accessStatus, setAccessStatus] = useState(user.accessStatus || 'active')

  const initialDateStr = user.accessExpiresAt
    ? new Date(user.accessExpiresAt).toISOString().split('T')[0]
    : ''
  const [expiresDate, setExpiresDate] = useState(initialDateStr)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSetDays = (days) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    setExpiresDate(d.toISOString().split('T')[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      let accessExpiresAt = null
      if (expiresDate) {
        // Set to end of the day 23:59:59
        const d = new Date(expiresDate)
        d.setHours(23, 59, 59, 999)
        accessExpiresAt = d.getTime()
      }

      await onSave(user.id, {
        caseLimit: Number(caseLimit) >= 0 ? Number(caseLimit) : 3,
        accessExpiresAt,
        accessStatus,
      })
      onClose()
    } catch (err) {
      setError(err?.message || 'Не удалось сохранить настройки')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Настройка лимитов пользователя</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.userSummary}>
              <span className={styles.userName}>
                {user.displayName || user.companyName || 'Без имени'}
              </span>
              <span className={styles.userEmail}>{user.email || `ID: ${user.id}`}</span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="caseLimitInput" className={styles.label}>
                Лимит генераций кейсов
              </label>
              <input
                id="caseLimitInput"
                type="number"
                min="0"
                max="1000"
                className={styles.input}
                value={caseLimit}
                onChange={(e) => setCaseLimit(e.target.value)}
                required
              />
              <span className={styles.hint}>
                Сейчас создано: {user.casesCount || 0} шт. (останется: {Math.max(0, caseLimit - (user.casesCount || 0))})
              </span>
              <div className={styles.quickButtons}>
                <button type="button" className={styles.quickBtn} onClick={() => setCaseLimit(3)}>
                  3 кейса
                </button>
                <button type="button" className={styles.quickBtn} onClick={() => setCaseLimit(5)}>
                  5 кейсов
                </button>
                <button type="button" className={styles.quickBtn} onClick={() => setCaseLimit(10)}>
                  10 кейсов
                </button>
                <button
                  type="button"
                  className={styles.quickBtn}
                  onClick={() => setCaseLimit((prev) => Number(prev) + 5)}
                >
                  +5 к текущему
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="expiresDateInput" className={styles.label}>
                Срок действия доступа
              </label>
              <input
                id="expiresDateInput"
                type="date"
                className={styles.input}
                value={expiresDate}
                onChange={(e) => setExpiresDate(e.target.value)}
              />
              <span className={styles.hint}>
                Оставьте пустым, если доступ бессрочный.
              </span>
              <div className={styles.quickButtons}>
                <button type="button" className={styles.quickBtn} onClick={() => handleSetDays(7)}>
                  +7 дней
                </button>
                <button type="button" className={styles.quickBtn} onClick={() => handleSetDays(14)}>
                  +14 дней
                </button>
                <button type="button" className={styles.quickBtn} onClick={() => handleSetDays(30)}>
                  +30 дней
                </button>
                <button type="button" className={styles.quickBtn} onClick={() => setExpiresDate('')}>
                  Бессрочно
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="statusSelect" className={styles.label}>
                Статус доступа
              </label>
              <select
                id="statusSelect"
                className={styles.input}
                value={accessStatus}
                onChange={(e) => setAccessStatus(e.target.value)}
              >
                <option value="active">Активен (active)</option>
                <option value="blocked">Заблокирован (blocked)</option>
                <option value="waitlist">Лист ожидания (waitlist)</option>
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSaving}>
              Отмена
            </button>
            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

EditUserLimitsModal.propTypes = {
  user: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
}
