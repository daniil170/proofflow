import { useEffect, useMemo, useState } from 'react'
import { getApplicationRepository } from '@/shared/api'

export const useAdminApplications = ({
  repository = getApplicationRepository(),
} = {}) => {
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [referenceTime, setReferenceTime] = useState(() => Date.now())

  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [dateFilter, setDateFilterState] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedAppId, setSelectedAppId] = useState(null)

  const setDateFilter = (filter) => {
    setReferenceTime(Date.now())
    setDateFilterState(filter)
  }

  useEffect(() => {
    let isMounted = true

    const unsubscribe = repository.subscribeApplications(
      (items) => {
        if (!isMounted) return
        setApplications(items)
        setIsLoading(false)
      },
      (err) => {
        if (!isMounted) return
        setError(err?.message || 'Не удалось загрузить список заявок')
        setIsLoading(false)
      }
    )

    return () => {
      isMounted = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [repository])

  const newCount = useMemo(() => {
    return applications.filter((app) => app.status === 'new').length
  }, [applications])

  const filteredApplications = useMemo(() => {
    const dayMs = 86400000
    const todayDate = new Date(referenceTime)
    todayDate.setHours(0, 0, 0, 0)
    const todayStart = todayDate.getTime()

    return applications
      .filter((app) => {
        if (statusFilter !== 'all' && app.status !== statusFilter) return false
        if (channelFilter !== 'all') {
          const appChannel = app.channel || app.source || 'web'
          if (appChannel !== channelFilter) return false
        }
        if (dateFilter !== 'all') {
          const created = app.createdAt || 0
          if (dateFilter === 'today' && created < todayStart) return false
          if (dateFilter === '7d' && created < referenceTime - 7 * dayMs) return false
          if (dateFilter === '30d' && created < referenceTime - 30 * dayMs) return false
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const emailMatch = app.email?.toLowerCase().includes(q)
          const tgMatch = app.telegramUsername?.toLowerCase().includes(q)
          const codeMatch = app.inviteCode?.toLowerCase().includes(q)
          const noteMatch = app.ownerNote?.toLowerCase().includes(q)
          if (!emailMatch && !tgMatch && !codeMatch && !noteMatch) return false
        }
        return true
      })
      .sort((a, b) => {
        const timeA = a.createdAt || 0
        const timeB = b.createdAt || 0
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
      })
  }, [applications, statusFilter, channelFilter, dateFilter, searchQuery, sortOrder, referenceTime])

  const selectedApplication = useMemo(() => {
    if (!selectedAppId) return null
    return applications.find((app) => app.id === selectedAppId) || null
  }, [applications, selectedAppId])

  const saveNote = async (applicationId, note) => {
    await repository.updateNote(applicationId, note)
  }

  const updateStatus = async (applicationId, status, rejectReason = '') => {
    await repository.updateStatus(applicationId, status, rejectReason)
  }

  const updateApplication = async (applicationId, patch) => {
    if (patch.status) {
      await updateStatus(applicationId, patch.status, patch.rejectReason || '')
    }
    if (patch.ownerNote !== undefined) {
      await saveNote(applicationId, patch.ownerNote)
    }
  }

  return {
    applications: filteredApplications,
    filteredApplications,
    allApplications: applications,
    totalCount: applications.length,
    newCount,
    isLoading,
    error,
    statusFilter,
    channelFilter,
    dateFilter,
    searchQuery,
    sortOrder,
    selectedApplication,
    setStatusFilter,
    setChannelFilter,
    setDateFilter,
    setSearchQuery,
    setSortOrder,
    setSelectedAppId,
    saveNote,
    updateOwnerNote: saveNote,
    updateStatus,
    updateApplication,
  }
}
