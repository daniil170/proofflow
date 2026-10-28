import { ADMIN_STORAGE_KEYS } from './types.ts'
import { mockAnalyticsGateway } from '../analytics/mockAnalyticsGateway.js'

const generateMockCode = () => {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
  const rand = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `PF-${rand(5)}-${rand(5)}`
}

const INITIAL_MOCK_APPLICATIONS = []
const INITIAL_MOCK_INVITES = []

const getStoredApplications = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEYS.MOCK_APPLICATIONS)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const cleaned = parsed.filter((app) => app && !String(app.id || '').startsWith('app-mock-'))
    if (cleaned.length !== parsed.length) {
      window.localStorage.setItem(
        ADMIN_STORAGE_KEYS.MOCK_APPLICATIONS,
        JSON.stringify(cleaned)
      )
    }
    return cleaned
  } catch {
    return []
  }
}

const getStoredInvites = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEYS.MOCK_INVITES)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const cleaned = parsed.filter(
      (inv) => inv && !String(inv.applicationId || '').startsWith('app-mock-')
    )
    if (cleaned.length !== parsed.length) {
      window.localStorage.setItem(
        ADMIN_STORAGE_KEYS.MOCK_INVITES,
        JSON.stringify(cleaned)
      )
    }
    return cleaned
  } catch {
    return []
  }
}

let applications = getStoredApplications()
let invites = getStoredInvites()

const appListeners = new Set()
const inviteListeners = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (!event.key || event.key === ADMIN_STORAGE_KEYS.MOCK_APPLICATIONS) {
      applications = getStoredApplications()
      notifyAppListeners()
    }
    if (!event.key || event.key === ADMIN_STORAGE_KEYS.MOCK_INVITES) {
      invites = getStoredInvites()
      notifyInviteListeners()
    }
  })
}

const notifyAppListeners = () => {
  appListeners.forEach((cb) => cb([...applications]))
}

const notifyInviteListeners = () => {
  inviteListeners.forEach((cb) => cb([...invites]))
}

const persistApplications = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(
      ADMIN_STORAGE_KEYS.MOCK_APPLICATIONS,
      JSON.stringify(applications)
    )
  }
  notifyAppListeners()
}

const persistInvites = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(
      ADMIN_STORAGE_KEYS.MOCK_INVITES,
      JSON.stringify(invites)
    )
  }
  notifyInviteListeners()
}

export const mockApplicationRepository = Object.freeze({
  subscribeApplications(callback) {
    applications = getStoredApplications()
    appListeners.add(callback)
    queueMicrotask(() => {
      callback([...applications])
    })
    return () => {
      appListeners.delete(callback)
    }
  },

  async updateNote(applicationId, note) {
    applications = applications.map((app) =>
      app.id === applicationId
        ? {
            ...app,
            ownerNote: note,
            updatedAt: Date.now(),
          }
        : app
    )
    persistApplications()
  },

  async updateStatus(applicationId, status, rejectReason = '') {
    applications = applications.map((app) =>
      app.id === applicationId
        ? {
            ...app,
            status,
            rejectReason: rejectReason || app.rejectReason,
            updatedAt: Date.now(),
            history: [
              ...(app.history || []),
              {
                action: `status_${status}`,
                timestamp: Date.now(),
                performedBy: 'admin',
                note: rejectReason,
              },
            ],
          }
        : app
    )
    persistApplications()
  },

  async markInvited(applicationId) {
    const now = Date.now()
    applications = applications.map((app) =>
      app.id === applicationId
        ? {
            ...app,
            status: 'invited',
            invitedAt: now,
            updatedAt: now,
            history: [
              ...(app.history || []),
              {
                action: 'invited',
                timestamp: now,
                performedBy: 'admin',
              },
            ],
          }
        : app
    )
    persistApplications()
  },
})

export const mockAdminInviteRepository = Object.freeze({
  subscribeInvites(callback) {
    inviteListeners.add(callback)
    queueMicrotask(() => {
      callback([...invites])
    })
    return () => {
      inviteListeners.delete(callback)
    }
  },

  async createInvite(applicationId) {
    const app = applications.find((a) => a.id === applicationId)
    if (!app) {
      throw new Error('Заявка не найдена')
    }

    if (app.inviteCode) {
      const existing = invites.find((i) => i.code === app.inviteCode)
      if (existing && existing.status === 'issued' && existing.expiresAt > Date.now()) {
        return {
          success: true,
          invite: existing,
          reused: true,
        }
      }
    }

    const code = generateMockCode()
    const now = Date.now()
    const expiresAt = now + 14 * 86400000

    const newInvite = {
      code,
      status: 'issued',
      applicationId,
      expiresAt,
      channel: app.channel || app.source || 'web',
      email: app.email || null,
      telegramUserId: app.telegramUserId || null,
      createdBy: 'admin',
      createdAt: now,
    }

    invites = [newInvite, ...invites]
    persistInvites()

    applications = applications.map((a) =>
      a.id === applicationId
        ? {
            ...a,
            status: 'approved',
            inviteCode: code,
            updatedAt: now,
            history: [
              ...(a.history || []),
              {
                action: 'approved',
                timestamp: now,
                performedBy: 'admin',
                note: `Выдан инвайт ${code}`,
              },
            ],
          }
        : a
    )
    persistApplications()

    return {
      success: true,
      invite: newInvite,
    }
  },

  async recreateInvite(applicationId) {
    const app = applications.find((a) => a.id === applicationId)
    if (!app) {
      throw new Error('Заявка не найдена')
    }

    if (app.inviteCode) {
      invites = invites.map((i) =>
        i.code === app.inviteCode ? { ...i, status: 'revoked' } : i
      )
    }

    const code = generateMockCode()
    const now = Date.now()
    const expiresAt = now + 14 * 86400000

    const newInvite = {
      code,
      status: 'issued',
      applicationId,
      expiresAt,
      channel: app.channel || app.source || 'web',
      email: app.email || null,
      telegramUserId: app.telegramUserId || null,
      createdBy: 'admin',
      createdAt: now,
    }

    invites = [newInvite, ...invites]
    persistInvites()

    applications = applications.map((a) =>
      a.id === applicationId
        ? {
            ...a,
            status: 'approved',
            inviteCode: code,
            updatedAt: now,
            history: [
              ...(a.history || []),
              {
                action: 'recreated',
                timestamp: now,
                performedBy: 'admin',
                note: `Перевыпущен инвайт ${code}`,
              },
            ],
          }
        : a
    )
    persistApplications()

    return {
      success: true,
      invite: newInvite,
    }
  },

  async revokeInvite(code, reason = '') {
    invites = invites.map((i) => (i.code === code ? { ...i, status: 'revoked' } : i))
    persistInvites()

    const targetInvite = invites.find((i) => i.code === code)
    if (targetInvite?.applicationId) {
      applications = applications.map((a) =>
        a.id === targetInvite.applicationId
          ? {
              ...a,
              updatedAt: Date.now(),
              history: [
                ...(a.history || []),
                {
                  action: 'invite_revoked',
                  timestamp: Date.now(),
                  performedBy: 'admin',
                  note: reason || 'Отозвано',
                },
              ],
            }
          : a
      )
      persistApplications()
    }

    return { success: true }
  },
})

export const mockAnalyticsRepository = Object.freeze({
  async getAnalytics(period = '7d') {
    const now = Date.now()
    const dayMs = 86400000
    const filterDays = period === '7d' ? 7 : period === '30d' ? 30 : 365
    const cutoffTime = period === 'all' ? 0 : now - filterDays * dayMs

    const filtered = applications.filter((app) => (app.createdAt || 0) >= cutoffTime)

    const totalApplications = filtered.length
    const weekAgo = now - 7 * dayMs
    const todayStart = new Date().setHours(0, 0, 0, 0)

    const weekApplications = filtered.filter((app) => (app.createdAt || 0) >= weekAgo).length
    const todayApplications = filtered.filter((app) => (app.createdAt || 0) >= todayStart).length
    const activatedApplications = filtered.filter((app) => app.status === 'activated').length

    const conversionRate =
      totalApplications > 0
        ? Math.round((activatedApplications / totalApplications) * 100)
        : 0

    const channelBreakdown = {
      web: filtered.filter((a) => (a.channel || a.source) === 'web').length,
      telegram: filtered.filter((a) => (a.channel || a.source) === 'telegram').length,
    }

    const businessTypeBreakdown = {}
    filtered.forEach((app) => {
      const type = app.businessType || 'other'
      businessTypeBreakdown[type] = (businessTypeBreakdown[type] || 0) + 1
    })

    const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : 14
    const dailyTrend = []
    for (let i = daysCount - 1; i >= 0; i--) {
      const targetDate = new Date(now - i * dayMs)
      const dateString = targetDate.toISOString().slice(0, 10)
      const label = targetDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      })
      const count = filtered.filter((a) => {
        if (!a.createdAt) return false
        const d = new Date(a.createdAt).toISOString().slice(0, 10)
        return d === dateString
      }).length

      dailyTrend.push({
        date: dateString,
        label,
        count,
      })
    }

    const funnel = [
      { stage: 'new', label: 'Новые', count: filtered.filter((a) => a.status === 'new').length },
      { stage: 'approved', label: 'Одобрены', count: filtered.filter((a) => a.status === 'approved').length },
      { stage: 'invited', label: 'Приглашены', count: filtered.filter((a) => a.status === 'invited').length },
      { stage: 'activated', label: 'Активированы', count: activatedApplications },
    ]

    let mockEvents
    try {
      mockEvents = await mockAnalyticsGateway.getEvents()
    } catch {
      mockEvents = []
    }

    const FIELD_LABELS = {
      metric: 'Метрика и число',
      problem: 'Проблема («Было»)',
      solution: 'Решение («Сделано»)',
      result: 'Результат («Стало»)',
      quote: 'Цитата клиента',
      author: 'Подпись автора',
    }

    let productAnalytics
    if (mockEvents.length > 0) {
      const casesStarted = mockEvents.filter((e) => e.eventName === 'case_started').length
      const reachedReview = mockEvents.filter((e) => e.eventName === 'review_opened').length
      const casesPublished = mockEvents.filter(
        (e) =>
          e.eventName === 'case_confirmed' ||
          e.eventName === 'link_copied' ||
          e.eventName === 'embed_copied'
      ).length
      const feedbackEvents = mockEvents.filter((e) => e.eventName === 'feedback_given')
      const positiveFeedback = feedbackEvents.filter(
        (e) =>
          e.metadata?.rating === 'positive' ||
          e.metadata?.rating === 'up' ||
          e.metadata?.score === 1
      ).length
      const negativeFeedback = feedbackEvents.filter(
        (e) =>
          e.metadata?.rating === 'negative' ||
          e.metadata?.rating === 'down' ||
          e.metadata?.score === -1
      ).length
      const totalFeedback = positiveFeedback + negativeFeedback
      const satisfactionRate =
        totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 100

      const fieldCounts = {}
      mockEvents
        .filter((e) => e.eventName === 'field_edited')
        .forEach((e) => {
          const key = e.metadata?.field || 'other'
          fieldCounts[key] = (fieldCounts[key] || 0) + 1
        })

      const fieldEdits = Object.entries(FIELD_LABELS).map(([field, label]) => ({
        field,
        label,
        count: fieldCounts[field] || 0,
      }))

      productAnalytics = {
        casesStarted,
        reachedReview,
        casesPublished,
        positiveFeedback,
        negativeFeedback,
        satisfactionRate,
        fieldEdits,
      }
    } else {
      productAnalytics = {
        casesStarted: 0,
        reachedReview: 0,
        casesPublished: 0,
        positiveFeedback: 0,
        negativeFeedback: 0,
        satisfactionRate: 0,
        fieldEdits: Object.entries(FIELD_LABELS).map(([field, label]) => ({
          field,
          label,
          count: 0,
        })),
      }
    }

    return {
      totalApplications,
      weekApplications,
      todayApplications,
      activatedApplications,
      conversionRate,
      channelBreakdown,
      businessTypeBreakdown,
      dailyTrend,
      funnel,
      productAnalytics,
      hasEvents: mockEvents.length > 0,
    }
  },
})
