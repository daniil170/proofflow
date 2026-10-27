import PropTypes from 'prop-types'
import styles from './ApplicationsTable.module.css'

const STATUS_LABELS = {
  new: 'Новая',
  approved: 'Одобрена',
  invited: 'Приглашена',
  activated: 'Активирована',
  rejected: 'Отклонена',
}

const BUSINESS_TYPE_LABELS = {
  agency_or_studio: 'Агентство / Студия',
  marketing_agency: 'Маркетинг',
  web_studio: 'Веб-студия',
  it_outsource: 'IT-аутсорс',
  consulting: 'Консалтинг',
  freelance: 'Фриланс / Инди',
}

export const ApplicationsTable = ({
  applications = [],
  statusFilter,
  channelFilter,
  dateFilter,
  searchQuery,
  sortOrder,
  onStatusFilterChange,
  onChannelFilterChange,
  onDateFilterChange,
  onSearchChange,
  onSortOrderChange,
  onSelectApplication,
}) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return '—'
    const d = new Date(timestamp)
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.filtersGroup}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по контакту, коду или заметке..."
            className={styles.searchInput}
          />

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className={styles.select}
          >
            <option value="all">Все статусы</option>
            <option value="new">Новые</option>
            <option value="approved">Одобренные</option>
            <option value="invited">Приглашенные</option>
            <option value="activated">Активированные</option>
            <option value="rejected">Отклоненные</option>
          </select>

          <select
            value={channelFilter}
            onChange={(e) => onChannelFilterChange(e.target.value)}
            className={styles.select}
          >
            <option value="all">Все каналы</option>
            <option value="web">Веб-сайт</option>
            <option value="telegram">Telegram-бот</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className={styles.select}
          >
            <option value="all">За всё время</option>
            <option value="today">За сегодня</option>
            <option value="7d">Последние 7 дней</option>
            <option value="30d">Последние 30 дней</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value)}
            className={styles.select}
          >
            <option value="desc">Сначала новые</option>
            <option value="asc">Сначала старые</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Дата</th>
              <th className={styles.th}>Канал</th>
              <th className={styles.th}>Контакт</th>
              <th className={styles.th}>Тип бизнеса</th>
              <th className={styles.th}>Объём</th>
              <th className={styles.th}>Текущий процесс</th>
              <th className={styles.th}>Источник</th>
              <th className={styles.th}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  Заявки не найдены
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr
                  key={app.id}
                  className={styles.tr}
                  onClick={() => onSelectApplication(app.id)}
                >
                  <td className={styles.td}>{formatDate(app.createdAt)}</td>
                  <td className={styles.td}>
                    <span className={styles.channelBadge}>
                      {(app.channel || app.source) === 'telegram'
                        ? 'Telegram'
                        : 'Web'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.contactCol}>
                      {app.email && (
                        <a
                          href={`mailto:${app.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.contactLink}
                        >
                          {app.email}
                        </a>
                      )}
                      {app.telegramUsername && (
                        <a
                          href={`https://t.me/${app.telegramUsername.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={styles.contactLink}
                        >
                          @{app.telegramUsername.replace(/^@/, '')} ↗
                        </a>
                      )}
                    </div>
                  </td>
                  <td className={styles.td}>
                    {BUSINESS_TYPE_LABELS[app.businessType] || app.businessType}
                  </td>
                  <td className={styles.td}>{app.casesVolume}</td>
                  <td className={styles.td}>
                    <div className={styles.textTruncate}>
                      {app.currentProcess || '—'}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.contactMuted}>
                      {app.source || 'web'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.statusBadge} ${styles[`status_${app.status}`] || ''}`}
                    >
                      {STATUS_LABELS[app.status] || app.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileCards}>
        {applications.length === 0 ? (
          <div className={styles.emptyState}>Заявки не найдены</div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className={styles.mobileCard}
              onClick={() => onSelectApplication(app.id)}
            >
              <div className={styles.mobileCardHeader}>
                <span className={styles.contactMuted}>
                  {formatDate(app.createdAt)}
                </span>
                <span
                  className={`${styles.statusBadge} ${styles[`status_${app.status}`] || ''}`}
                >
                  {STATUS_LABELS[app.status] || app.status}
                </span>
              </div>

              <div className={styles.contactCol}>
                {app.email && <div>{app.email}</div>}
                {app.telegramUsername && <div>@{app.telegramUsername}</div>}
              </div>

              <div className={styles.contactMuted}>
                {BUSINESS_TYPE_LABELS[app.businessType] || app.businessType} •{' '}
                {app.casesVolume}
              </div>

              {app.currentProcess && (
                <div className={styles.textTruncate}>{app.currentProcess}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

ApplicationsTable.propTypes = {
  applications: PropTypes.array.isRequired,
  statusFilter: PropTypes.string.isRequired,
  channelFilter: PropTypes.string.isRequired,
  dateFilter: PropTypes.string.isRequired,
  searchQuery: PropTypes.string.isRequired,
  sortOrder: PropTypes.string.isRequired,
  onStatusFilterChange: PropTypes.func.isRequired,
  onChannelFilterChange: PropTypes.func.isRequired,
  onDateFilterChange: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSortOrderChange: PropTypes.func.isRequired,
  onSelectApplication: PropTypes.func.isRequired,
}
