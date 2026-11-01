import { useEffect, useState, useCallback } from 'react'
import { getAdminUsersRepository } from '@/shared/api'

export const useAdminUsers = ({
  repository = getAdminUsersRepository(),
} = {}) => {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await repository.getUsers()
      setUsers(list || [])
    } catch (err) {
      setError(err?.message || 'Не удалось загрузить список пользователей')
    } finally {
      setIsLoading(false)
    }
  }, [repository])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const updateUserLimits = useCallback(
    async (userId, payload) => {
      try {
        const res = await repository.updateUserLimits(userId, payload)
        if (res?.user) {
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, ...res.user } : u))
          )
        }
        return res
      } catch (err) {
        throw err
      }
    },
    [repository]
  )

  const filteredUsers = users.filter((u) => {
    if (statusFilter !== 'all' && u.accessStatus !== statusFilter) {
      return false
    }
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const matchEmail = u.email?.toLowerCase().includes(q)
    const matchName = u.displayName?.toLowerCase().includes(q)
    const matchCompany = u.companyName?.toLowerCase().includes(q)
    const matchTelegram = String(u.telegramUserId || '').includes(q)
    return matchEmail || matchName || matchCompany || matchTelegram
  })

  const metrics = {
    total: users.length,
    active: users.filter((u) => u.accessStatus === 'active').length,
    totalCases: users.reduce((sum, u) => sum + (u.casesCount || 0), 0),
    totalDownloads: users.reduce((sum, u) => sum + (u.downloadsCount || 0), 0),
    totalShares: users.reduce((sum, u) => sum + (u.sharesCount || 0), 0),
  }

  return {
    users: filteredUsers,
    allUsers: users,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    metrics,
    refreshUsers: fetchUsers,
    updateUserLimits,
  }
}
