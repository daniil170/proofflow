import { useState } from 'react'
import { useAdminUsers, UsersTable, EditUserLimitsModal } from '@/features/admin-users'
import styles from './AdminUsersPage.module.css'

export const AdminUsersPage = () => {
  const {
    users,
    allUsers,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    metrics,
    refreshUsers,
    updateUserLimits,
  } = useAdminUsers()

  const [selectedUser, setSelectedUser] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenEdit = (user) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  const handleSaveLimits = async (userId, payload) => {
    await updateUserLimits(userId, payload)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Пользователи</h1>
            <span className={styles.countBadge}>{metrics.total}</span>
          </div>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={refreshUsers}
            disabled={isLoading}
          >
            <span>Обновить</span>
          </button>
        </div>
        <p className={styles.subtitle}>
          Мониторинг активности участников беты: генерации карточек, скачивания и управление индивидуальными лимитами
        </p>
      </header>

      <section className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Всего пользователей</span>
          <span className={styles.metricValue}>{metrics.total}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Активных аккаунтов</span>
          <span className={styles.metricValue}>{metrics.active}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Сгенерировано кейсов</span>
          <span className={styles.metricValue}>{metrics.totalCases}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Скачиваний (PNG / Story)</span>
          <span className={styles.metricValue}>{metrics.totalDownloads}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Поделились ссылками</span>
          <span className={styles.metricValue}>{metrics.totalShares}</span>
        </div>
      </section>

      <div className={styles.filtersBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Поиск по имени, email, компании..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Все статусы ({allUsers.length})</option>
          <option value="active">Активные</option>
          <option value="waitlist">Лист ожидания</option>
          <option value="blocked">Заблокированные</option>
        </select>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {isLoading ? (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} role="status" aria-label="Загрузка пользователей" />
        </div>
      ) : (
        <UsersTable users={users} onEditLimits={handleOpenEdit} />
      )}

      <EditUserLimitsModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveLimits}
      />
    </div>
  )
}
