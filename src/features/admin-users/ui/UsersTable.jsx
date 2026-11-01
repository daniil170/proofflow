import PropTypes from 'prop-types'
import styles from './UsersTable.module.css'

export const UsersTable = ({ users, onEditLimits }) => {
  if (!users || users.length === 0) {
    return (
      <div className={styles.tableWrapper}>
        <div className={styles.emptyState}>Пользователи не найдены</div>
      </div>
    )
  }

  const formatLastActive = (ts) => {
    if (!ts) return '—'
    const date = new Date(ts)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatExpires = (ts) => {
    if (!ts) return <span className={styles.limitExpires}>Бессрочно</span>
    const isPast = Date.now() > ts
    const dateStr = new Date(ts).toLocaleDateString('ru-RU')
    return (
      <span className={isPast ? styles.limitExpired : styles.limitExpires}>
        {isPast ? `Истёк ${dateStr}` : `до ${dateStr}`}
      </span>
    )
  }

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Пользователь</th>
              <th className={styles.th}>Компания / Тип</th>
              <th className={styles.th}>Статус</th>
              <th className={styles.th} style={{ textAlign: 'center' }}>
                Кейсы / Лимит
              </th>
              <th className={styles.th} style={{ textAlign: 'center' }}>
                Скачивания
              </th>
              <th className={styles.th} style={{ textAlign: 'center' }}>
                Поделился
              </th>
              <th className={styles.th}>Срок доступа</th>
              <th className={styles.th}>Последняя активность</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const caseLimit = typeof u.caseLimit === 'number' ? u.caseLimit : 3
              const casesCount = u.casesCount || 0
              return (
                <tr key={u.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.userCell}>
                      <span className={styles.userName}>
                        {u.displayName || u.email || 'Без имени'}
                      </span>
                      <span className={styles.userSub}>
                        {u.email}
                        {u.telegramUserId ? ` · TG: ${u.telegramUserId}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.userCell}>
                      <span>{u.companyName || '—'}</span>
                      <span className={styles.userSub}>{u.businessType || ''}</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.badge} ${
                        u.accessStatus === 'active'
                          ? styles.badgeActive
                          : u.accessStatus === 'blocked'
                          ? styles.badgeBlocked
                          : styles.badgeWaitlist
                      }`}
                    >
                      {u.accessStatus || 'waitlist'}
                    </span>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'center' }}>
                    <div className={styles.limitBox}>
                      <span className={styles.limitValue}>
                        {casesCount} / {caseLimit}
                      </span>
                      <span className={styles.userSub}>
                        (осталось: {Math.max(0, caseLimit - casesCount)})
                      </span>
                    </div>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'center' }}>
                    <span className={styles.statBadge}>{u.downloadsCount || 0}</span>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'center' }}>
                    <span className={styles.statBadge}>{u.sharesCount || 0}</span>
                  </td>
                  <td className={styles.td}>{formatExpires(u.accessExpiresAt)}</td>
                  <td className={styles.td}>{formatLastActive(u.lastActiveAt || u.createdAt)}</td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => onEditLimits(u)}
                    >
                      Изменить лимиты
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

UsersTable.propTypes = {
  users: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEditLimits: PropTypes.func.isRequired,
}
