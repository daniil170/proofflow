import { useOutletContext } from 'react-router-dom'
import {
  ApplicationsTable,
  ApplicationDetailsDrawer,
  useAdminApplications,
} from '@/features/admin-applications'
import styles from './AdminApplicationsPage.module.css'

export const AdminApplicationsPage = () => {
  const contextState = useOutletContext()
  const fallbackState = useAdminApplications()
  const state = contextState || fallbackState

  const {
    filteredApplications,
    allApplications,
    totalCount,
    isLoading,
    error,
    statusFilter,
    channelFilter,
    dateFilter,
    searchQuery,
    sortOrder,
    setStatusFilter,
    setChannelFilter,
    setDateFilter,
    setSearchQuery,
    setSortOrder,
    selectedApplication,
    setSelectedAppId,
    updateApplication,
    updateOwnerNote,
    deleteApplication,
  } = state

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Заявки на бету</h1>
          </div>
          <p className={styles.subtitle}>Загрузка данных...</p>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>Ошибка загрузки заявок</h2>
          <p className={styles.errorMessage}>{String(error)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Заявки на бету</h1>
          <span className={styles.badge}>{totalCount} всего</span>
        </div>
        <p className={styles.subtitle}>
          Управление входящими заявками из веб-формы и Telegram-бота
        </p>
      </div>

      <ApplicationsTable
        applications={filteredApplications}
        allApplications={allApplications || filteredApplications}
        statusFilter={statusFilter}
        channelFilter={channelFilter}
        dateFilter={dateFilter}
        searchQuery={searchQuery}
        sortOrder={sortOrder}
        onStatusFilterChange={setStatusFilter}
        onChannelFilterChange={setChannelFilter}
        onDateFilterChange={setDateFilter}
        onSearchChange={setSearchQuery}
        onSortOrderChange={setSortOrder}
        onSelectApplication={(appId) => setSelectedAppId(typeof appId === 'string' ? appId : appId?.id)}
        onUpdateStatus={(id, status, rejectReason) =>
          updateApplication(id, { status, rejectReason })
        }
        onDeleteApplication={(id) => deleteApplication(id)}
      />

      {selectedApplication && (
        <ApplicationDetailsDrawer
          application={selectedApplication}
          onClose={() => setSelectedAppId(null)}
          onSaveNote={(_id, note) => updateOwnerNote(selectedApplication.id, note)}
          onUpdateStatus={(_id, status, rejectReason) =>
            updateApplication(selectedApplication.id, { status, rejectReason })
          }
          onDelete={(_id) => deleteApplication(selectedApplication.id)}
        />
      )}
    </div>
  )
}
