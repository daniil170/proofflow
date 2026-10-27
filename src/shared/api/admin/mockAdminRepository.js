import { ADMIN_STORAGE_KEYS } from './types.ts'
import { mockAnalyticsGateway } from '../analytics/mockAnalyticsGateway.js'

const generateMockCode = () => {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
  const rand = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `PF-${rand(5)}-${rand(5)}`
}

const INITIAL_MOCK_APPLICATIONS = [
  {
    id: 'app-mock-1',
    source: 'web',
    channel: 'web',
    email: 'mikhail@vector-studio.ru',
    telegramUsername: 'mikhail_vector',
    businessType: 'web_studio',
    casesVolume: '4_to_10',
    currentProcess: 'Собираем PDF-презентации в Figma, уходит по 3 дня на кейс',
    consent: true,
    status: 'new',
    history: [{ action: 'submitted', timestamp: Date.now() - 3600000, performedBy: 'client' }],
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'app-mock-2',
    source: 'telegram',
    channel: 'telegram',
    email: null,
    telegramUsername: 'artem_marketing',
    telegramUserId: 554433221,
    businessType: 'marketing_agency',
    casesVolume: '10_to_30',
    currentProcess: 'Тексты пишет копирайтер по перепискам из Telegram',
    consent: true,
    status: 'new',
    history: [{ action: 'submitted', timestamp: Date.now() - 14400000, performedBy: 'bot' }],
    createdAt: Date.now() - 14400000,
  },
  {
    id: 'app-mock-3',
    source: 'web',
    channel: 'web',
    email: 'daria@growth-agency.com',
    telegramUsername: null,
    businessType: 'agency_or_studio',
    casesVolume: '4_to_10',
    currentProcess: 'Пишем статьи на VC.ru',
    consent: true,
    status: 'approved',
    inviteCode: 'PF-8T2K-7V',
    ownerNote: 'Сильное агентство с хорошим портфолио',
    history: [
      { action: 'submitted', timestamp: Date.now() - 86400000, performedBy: 'client' },
      { action: 'approved', timestamp: Date.now() - 43200000, performedBy: 'admin', note: 'Выдан инвайт PF-8T2K-7V' },
    ],
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'app-mock-4',
    source: 'web',
    channel: 'web',
    email: 'ivan@dev-outsource.io',
    telegramUsername: 'ivan_lead',
    businessType: 'it_outsource',
    casesVolume: '1_to_3',
    currentProcess: 'Кейсы почти не делаем, нет времени',
    consent: true,
    status: 'invited',
    inviteCode: 'PF-5M9Q-3X',
    invitedAt: Date.now() - 100000000,
    history: [
      { action: 'submitted', timestamp: Date.now() - 172800000, performedBy: 'client' },
      { action: 'approved', timestamp: Date.now() - 120000000, performedBy: 'admin', note: 'Выдан инвайт PF-5M9Q-3X' },
      { action: 'invited', timestamp: Date.now() - 100000000, performedBy: 'admin' },
    ],
    createdAt: Date.now() - 172800000,
  },
  {
    id: 'app-mock-5',
    source: 'telegram',
    channel: 'telegram',
    email: 'elena@brandconsult.ru',
    telegramUsername: 'elena_brand',
    telegramUserId: 887766554,
    businessType: 'consulting',
    casesVolume: '1_to_3',
    currentProcess: 'Отзывы в WhatsApp скриним',
    consent: true,
    status: 'activated',
    inviteCode: 'PF-2N6Y-4B',
    invitedAt: Date.now() - 250000000,
    activatedAt: Date.now() - 200000000,
    history: [
      { action: 'submitted', timestamp: Date.now() - 300000000, performedBy: 'bot' },
      { action: 'approved', timestamp: Date.now() - 260000000, performedBy: 'admin' },
      { action: 'invited', timestamp: Date.now() - 250000000, performedBy: 'admin' },
      { action: 'activated', timestamp: Date.now() - 200000000, performedBy: 'system' },
    ],
    createdAt: Date.now() - 300000000,
  },
]

const INITIAL_MOCK_INVITES = [
  {
    code: 'PF-8T2K-7V',
    status: 'issued',
    applicationId: 'app-mock-3',
    expiresAt: Date.now() + 14 * 86400000,
    channel: 'web',
    email: 'daria@growth-agency.com',
    createdBy: 'admin',
    createdAt: Date.now() - 43200000,
  },
  {
    code: 'PF-5M9Q-3X',
    status: 'issued',
    applicationId: 'app-mock-4',
    expiresAt: Date.now() + 12 * 86400000,
    channel: 'web',
    email: 'ivan@dev-outsource.io',
    telegramUsername: 'ivan_lead',
    createdBy: 'admin',
    createdAt: Date.now() - 120000000,
  },
  {
    code: 'PF-2N6Y-4B',
    status: 'used',
    applicationId: 'app-mock-5',
    expiresAt: Date.now() + 10 * 86400000,
    channel: 'telegram',
    email: 'elena@brandconsult.ru',
    telegramUserId: 887766554,
    usedBy: 'user-mock-elena',
    usedAt: Date.now() - 200000000,
    createdBy: 'admin',
    createdAt: Date.now() - 260000000,
  },
]

const getStoredApplications = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [...INITIAL_MOCK_APPLICATIONS]
  }
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEYS.MOCK_APPLICATIONS)
    if (!raw) {
      window.localStorage.setItem(
        ADMIN_STORAGE_KEYS.MOCK_APPLICATIONS,
        JSON.stringify(INITIAL_MOCK_APPLICATIONS)
      )
      return [...INITIAL_MOCK_APPLICATIONS]
    }
    return JSON.parse(raw)
  } catch {
    return [...INITIAL_MOCK_APPLICATIONS]
  }
}

const getStoredInvites = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [...INITIAL_MOCK_INVITES]
  }
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEYS.MOCK_INVITES)
    if (!raw) {
      window.localStorage.setItem(
        ADMIN_STORAGE_KEYS.MOCK_INVITES,
        JSON.stringify(INITIAL_MOCK_INVITES)
      )
      return [...INITIAL_MOCK_INVITES]
    }
    return JSON.parse(raw)
  } catch {
    return [...INITIAL_MOCK_INVITES]
  }
}

let applications = getStoredApplications()
let invites = getStoredInvites()

const appListeners = new Set()
const inviteListeners = new Set()

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
        casesStarted: 18,
        reachedReview: 14,
        casesPublished: 11,
        positiveFeedback: 9,
        negativeFeedback: 1,
        satisfactionRate: 90,
        fieldEdits: [
          { field: 'quote', label: 'Цитата клиента', count: 12 },
          { field: 'metric', label: 'Метрика и число', count: 9 },
          { field: 'problem', label: 'Проблема («Было»)', count: 6 },
          { field: 'solution', label: 'Решение («Сделано»)', count: 4 },
          { field: 'result', label: 'Результат («Стало»)', count: 4 },
          { field: 'author', label: 'Подпись автора', count: 3 },
        ],
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
      hasEvents: true,
    }
  },
})
