import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import styles from './ApplicationsTable.module.css'

const STATUS_LABELS = {
  new: 'Новая',
  approved: 'Одобрена',
  invited: 'Приглашена',
  activated: 'Активирована',
  rejected: 'Отклонена',
}

const STATUS_COLORS = {
  all: '#94a3b8',
  new: '#d4ff3a',
  approved: '#3b82f6',
  invited: '#a855f7',
  activated: '#22c55e',
  rejected: '#ef4444',
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
  allApplications = [],
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
  onUpdateStatus,
  onDeleteApplication,
}) => {
  const [deletingApp, setDeletingApp] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const [rejectingApp, setRejectingApp] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectError, setRejectError] = useState('')

  const counts = useMemo(() => {
    const total = allApplications.length
    const byStatus = {
      all: total,
      new: 0,
      approved: 0,
      invited: 0,
      activated: 0,
      rejected: 0,
    }
    allApplications.forEach((app) => {
      if (byStatus[app.status] !== undefined) {
        byStatus[app.status] += 1
      }
    })
    return byStatus
  }, [allApplications])

  const formatDate = (timestamp) => {
    if (!timestamp) return '—'
    const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleConfirmDelete = async () => {
    if (!deletingApp || !onDeleteApplication) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await onDeleteApplication(deletingApp.id)
      setDeletingApp(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Не удалось удалить заявку')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleConfirmReject = async () => {
    if (!rejectingApp || !onUpdateStatus) return
    setIsRejecting(true)
    setRejectError('')
    try {
      await onUpdateStatus(rejectingApp.id, 'rejected', rejectReason)
      setRejectingApp(null)
      setRejectReason('')
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Не удалось отклонить заявку')
    } finally {
      setIsRejecting(false)
    }
  }

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== 'all' ||
    channelFilter !== 'all' ||
    dateFilter !== 'all'

  const resetFilters = () => {
    onSearchChange('')
    onStatusFilterChange('all')
    onChannelFilterChange('all')
    onDateFilterChange('all')
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.metricsGrid}>
        <button
          type="button"
          onClick={() => onStatusFilterChange('all')}
          className={`${styles.metricCard} ${statusFilter === 'all' ? styles.metricCardActive : ''}`}
        >
          <div className={styles.metricHeader}>
            <span className={styles.metricDot} style={{ backgroundColor: STATUS_COLORS.all }} />
            <span>Все заявки</span>
          </div>
          <span className={styles.metricValue}>{counts.all}</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('new')}
          className={`${styles.metricCard} ${statusFilter === 'new' ? styles.metricCardActive : ''}`}
        >
          <div className={styles.metricHeader}>
            <span className={styles.metricDot} style={{ backgroundColor: STATUS_COLORS.new }} />
            <span>Новые</span>
          </div>
          <span className={styles.metricValue}>{counts.new}</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('approved')}
          className={`${styles.metricCard} ${statusFilter === 'approved' ? styles.metricCardActive : ''}`}
        >
          <div className={styles.metricHeader}>
            <span className={styles.metricDot} style={{ backgroundColor: STATUS_COLORS.approved }} />
            <span>Одобренные</span>
          </div>
          <span className={styles.metricValue}>{counts.approved}</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('invited')}
          className={`${styles.metricCard} ${statusFilter === 'invited' ? styles.metricCardActive : ''}`}
        >
          <div className={styles.metricHeader}>
            <span className={styles.metricDot} style={{ backgroundColor: STATUS_COLORS.invited }} />
            <span>Приглашены</span>
          </div>
          <span className={styles.metricValue}>{counts.invited}</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('activated')}
          className={`${styles.metricCard} ${statusFilter === 'activated' ? styles.metricCardActive : ''}`}
        >
          <div className={styles.metricHeader}>
            <span className={styles.metricDot} style={{ backgroundColor: STATUS_COLORS.activated }} />
            <span>Активированы</span>
          </div>
          <span className={styles.metricValue}>{counts.activated}</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('rejected')}
          className={`${styles.metricCard} ${statusFilter === 'rejected' ? styles.metricCardActive : ''}`}
        >
          <div className={styles.metricHeader}>
            <span className={styles.metricDot} style={{ backgroundColor: STATUS_COLORS.rejected }} />
            <span>Отклоненные</span>
          </div>
          <span className={styles.metricValue}>{counts.rejected}</span>
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Поиск по контакту, ID, компании или заметке..."
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className={styles.clearSearchBtn}
                aria-label="Очистить поиск"
              >
                ×
              </button>
            )}
          </div>

          <div className={styles.filtersGroup}>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className={styles.select}
              aria-label="Фильтр по статусу"
            >
              <option value="all">Все статусы ({counts.all})</option>
              <option value="new">Новые ({counts.new})</option>
              <option value="approved">Одобренные ({counts.approved})</option>
              <option value="invited">Приглашенные ({counts.invited})</option>
              <option value="activated">Активированные ({counts.activated})</option>
              <option value="rejected">Отклоненные ({counts.rejected})</option>
            </select>

            <select
              value={channelFilter}
              onChange={(e) => onChannelFilterChange(e.target.value)}
              className={styles.select}
              aria-label="Фильтр по каналу"
            >
              <option value="all">Все каналы</option>
              <option value="web">Веб-сайт</option>
              <option value="telegram">Telegram-бот</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className={styles.select}
              aria-label="Фильтр по дате"
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
              aria-label="Сортировка"
            >
              <option value="desc">Сначала новые</option>
              <option value="asc">Сначала старые</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className={styles.resetBtn}
              >
                Сбросить фильтры
              </button>
            )}
          </div>
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
              <th className={styles.th}>Статус</th>
              <th className={styles.th}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className={styles.emptyState}>
                    <p className={styles.emptyTitle}>Заявки не найдены</p>
                    <p className={styles.emptyDescription}>
                      По заданным критериям фильтрации нет заявок. Попробуйте изменить параметры поиска или сбросить фильтры.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className={styles.resetBtn}
                      >
                        Сбросить фильтры
                      </button>
                    )}
                  </div>
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
                      {(app.channel || app.source) === 'telegram' ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                          </svg>
                          Telegram
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                          Web
                        </>
                      )}
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
                      {app.telegramUsername ? (
                        <a
                          href={`https://t.me/${app.telegramUsername.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={styles.contactLink}
                        >
                          @{app.telegramUsername.replace(/^@/, '')} ↗
                        </a>
                      ) : app.telegramUserId ? (
                        <span className={styles.contactMuted}>
                          ID: {app.telegramUserId}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.businessBadge}>
                      {BUSINESS_TYPE_LABELS[app.businessType] || app.businessType || '—'}
                    </span>
                  </td>
                  <td className={styles.td}>{app.casesVolume || '—'}</td>
                  <td className={styles.td}>
                    <div className={styles.textTruncate} title={app.currentProcess || ''}>
                      {app.currentProcess || '—'}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.statusBadge} ${styles[`status_${app.status}`] || ''}`}
                    >
                      {STATUS_LABELS[app.status] || app.status}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actionsCell} onClick={(e) => e.stopPropagation()}>
                      {app.status !== 'rejected' && onUpdateStatus && (
                        <button
                          type="button"
                          onClick={() => setRejectingApp(app)}
                          className={`${styles.rowActionBtn} ${styles.rowActionReject}`}
                          title="Отклонить заявку"
                        >
                          Отклонить
                        </button>
                      )}
                      {onDeleteApplication && (
                        <button
                          type="button"
                          onClick={() => setDeletingApp(app)}
                          className={`${styles.rowActionBtn} ${styles.rowActionDelete}`}
                          title="Удалить заявку"
                          aria-label="Удалить заявку"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectApplication(app.id)}
                        className={styles.rowActionBtn}
                        title="Подробнее"
                      >
                        →
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileCards}>
        {applications.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Заявки не найдены</p>
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className={styles.mobileCard}
              onClick={() => onSelectApplication(app.id)}
            >
              <div className={styles.mobileCardHeader}>
                <span className={styles.contactMuted}>
                  {formatDate(app.createdAt)} • {(app.channel || app.source) === 'telegram' ? 'Telegram' : 'Web'}
                </span>
                <span
                  className={`${styles.statusBadge} ${styles[`status_${app.status}`] || ''}`}
                >
                  {STATUS_LABELS[app.status] || app.status}
                </span>
              </div>

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
                {app.telegramUsername ? (
                  <a
                    href={`https://t.me/${app.telegramUsername.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={styles.contactLink}
                  >
                    @{app.telegramUsername.replace(/^@/, '')} ↗
                  </a>
                ) : app.telegramUserId ? (
                  <div className={styles.contactMuted}>ID: {app.telegramUserId}</div>
                ) : null}
              </div>

              <div className={styles.contactMuted}>
                {BUSINESS_TYPE_LABELS[app.businessType] || app.businessType || '—'} • {app.casesVolume || '—'}
              </div>

              {app.currentProcess && (
                <div className={styles.textTruncate}>{app.currentProcess}</div>
              )}

              <div className={styles.mobileActions} onClick={(e) => e.stopPropagation()}>
                {app.status !== 'rejected' && onUpdateStatus && (
                  <button
                    type="button"
                    onClick={() => setRejectingApp(app)}
                    className={`${styles.rowActionBtn} ${styles.rowActionReject}`}
                  >
                    Отклонить
                  </button>
                )}
                {onDeleteApplication && (
                  <button
                    type="button"
                    onClick={() => setDeletingApp(app)}
                    className={`${styles.rowActionBtn} ${styles.rowActionDelete}`}
                  >
                    Удалить
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectApplication(app.id)}
                  className={styles.rowActionBtn}
                >
                  Открыть →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {deletingApp && (
        <div className={styles.modalOverlay} onClick={() => !isDeleting && setDeletingApp(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconDanger}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div className={styles.modalTitleGroup}>
                <h3 className={styles.modalTitle}>Удалить заявку?</h3>
                <p className={styles.modalText}>
                  Вы собираетесь безвозвратно удалить заявку{' '}
                  <strong>{deletingApp.email || (deletingApp.telegramUsername ? `@${deletingApp.telegramUsername}` : deletingApp.id)}</strong>.
                  Все связанные с ней данные и инвайт-коды также будут удалены.
                </p>
              </div>
            </div>

            {deleteError && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{deleteError}</div>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingApp(null)}
                className={styles.modalCancelBtn}
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className={styles.modalConfirmDangerBtn}
              >
                {isDeleting ? 'Удаление...' : 'Да, удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectingApp && (
        <div className={styles.modalOverlay} onClick={() => !isRejecting && setRejectingApp(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconWarn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div className={styles.modalTitleGroup}>
                <h3 className={styles.modalTitle}>Отклонить заявку?</h3>
                <p className={styles.modalText}>
                  Заявка от{' '}
                  <strong>{rejectingApp.email || (rejectingApp.telegramUsername ? `@${rejectingApp.telegramUsername}` : rejectingApp.id)}</strong>{' '}
                  будет переведена в статус «Отклонена».
                </p>
              </div>
            </div>

            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Причина отклонения (необязательно, для себя)"
              className={styles.modalInput}
            />

            {rejectError && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{rejectError}</div>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                disabled={isRejecting}
                onClick={() => setRejectingApp(null)}
                className={styles.modalCancelBtn}
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={handleConfirmReject}
                className={styles.modalConfirmDangerBtn}
              >
                {isRejecting ? 'Сохранение...' : 'Отклонить заявку'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

ApplicationsTable.propTypes = {
  applications: PropTypes.array.isRequired,
  allApplications: PropTypes.array,
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
  onUpdateStatus: PropTypes.func,
  onDeleteApplication: PropTypes.func,
}
