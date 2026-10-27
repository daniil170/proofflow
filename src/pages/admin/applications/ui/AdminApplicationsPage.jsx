import { useOutletContext } from 'react-router-dom'
import {
  ApplicationsTable,
  ApplicationDetailsDrawer,
  useAdminApplications,
} from '@/features/admin-applications'

export const AdminApplicationsPage = () => {
  const contextState = useOutletContext()
  const fallbackState = useAdminApplications()
  const state = contextState || fallbackState

  const {
    filteredApplications,
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
  } = state

  if (isLoading) {
    return <div>Загрузка заявок...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div>
      <ApplicationsTable
        applications={filteredApplications}
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
        onSelectApplication={(app) => setSelectedAppId(app.id)}
      />

      {selectedApplication && (
        <ApplicationDetailsDrawer
          application={selectedApplication}
          onClose={() => setSelectedAppId(null)}
          onSaveNote={(note) => updateOwnerNote(selectedApplication.id, note)}
          onUpdateStatus={(status, extra) => updateApplication(selectedApplication.id, { status, ...extra })}
        />
      )}
    </div>
  )
}
