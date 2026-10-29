import {
  collection,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirebaseApp } from '../firebase/app.js'

const getDbInstance = () => getFirestore(getFirebaseApp())
const getFunctionsInstance = () => getFunctions(getFirebaseApp())

export const createFirestoreApplicationRepository = () => ({
  subscribeApplications(callback, onError) {
    const db = getDbInstance()
    const q = query(
      collection(db, 'beta_signups'),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const apps = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        callback(apps)
      },
      (err) => {
        if (onError) onError(err)
      }
    )
  },

  async getApplications() {
    const db = getDbInstance()
    const q = query(
      collection(db, 'beta_signups'),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  async updateNote(applicationId, note) {
    const functions = getFunctionsInstance()
    const call = httpsCallable(functions, 'updateApplication')
    await call({ applicationId, ownerNote: note, patch: { ownerNote: note } })
  },

  async updateStatus(applicationId, status, rejectReason = '') {
    const functions = getFunctionsInstance()
    const call = httpsCallable(functions, 'updateApplication')
    await call({ applicationId, status, rejectReason, patch: { status, rejectReason } })
  },

  async markInvited(applicationId) {
    const functions = getFunctionsInstance()
    const call = httpsCallable(functions, 'markApplicationInvited')
    await call({ applicationId })
  },

  async deleteApplication(applicationId) {
    const functions = getFunctionsInstance()
    const call = httpsCallable(functions, 'deleteApplication')
    await call({ applicationId })
  },
})

export const createFirestoreAdminInviteRepository = () => ({
  subscribeInvites(callback, onError) {
    const db = getDbInstance()
    const q = query(
      collection(db, 'invites'),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const invites = snapshot.docs.map((docSnap) => ({
          code: docSnap.id,
          ...docSnap.data(),
        }))
        callback(invites)
      },
      (err) => {
        if (onError) onError(err)
      }
    )
  },

  async createInvite(applicationId) {
    const functions = getFunctionsInstance()
    const call = httpsCallable(functions, 'createInvite')
    const res = await call({ applicationId })
    return res.data
  },

  async recreateInvite(applicationId) {
    const functions = getFunctionsInstance()
    const call = httpsCallable(functions, 'recreateInvite')
    const res = await call({ applicationId })
    return res.data
  },

  async revokeInvite(code, reason = '') {
    const functions = getFunctionsInstance()
    const call = httpsCallable(functions, 'revokeInvite')
    const res = await call({ code, reason })
    return res.data
  },

  async getInviteByCode(code) {
    const db = getDbInstance()
    const snap = await getDocs(query(collection(db, 'invites')))
    const found = snap.docs.find((d) => d.id === code)
    return found ? { code: found.id, ...found.data() } : null
  },
})

export const createFirestoreAnalyticsRepository = () => ({
  async getAnalytics(period = '7d') {
    const db = getDbInstance()
    const now = Date.now()
    const dayMs = 86400000
    const filterDays = period === '7d' ? 7 : period === '30d' ? 30 : 365
    const cutoffTime = period === 'all' ? 0 : now - filterDays * dayMs

    const snap = await getDocs(collection(db, 'beta_signups'))
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const filtered = all.filter((app) => (app.createdAt || 0) >= cutoffTime)

    const totalApplications = filtered.length
    const weekAgo = now - 7 * dayMs
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    const todayStart = todayDate.getTime()

    const weekApplications = filtered.filter((app) => (app.createdAt || 0) >= weekAgo).length
    const todayApplications = filtered.filter((app) => (app.createdAt || 0) >= todayStart).length
    const activatedApplications = filtered.filter((app) => app.status === 'activated').length

    const conversionRate = totalApplications > 0
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

    const trendDays = period === 'all' ? 14 : filterDays
    const dailyTrend = []
    for (let i = trendDays - 1; i >= 0; i--) {
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

    let allEvents
    try {
      const eventsSnap = await getDocs(collection(db, 'events'))
      allEvents = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    } catch {
      allEvents = []
    }

    const filteredEvents =
      cutoffTime === 0
        ? allEvents
        : allEvents.filter((ev) => (ev.timestamp || 0) >= cutoffTime)

    const casesStarted = filteredEvents.filter((e) => e.eventName === 'case_started').length
    const reachedReview = filteredEvents.filter((e) => e.eventName === 'review_opened').length
    const casesPublished = filteredEvents.filter(
      (e) =>
        e.eventName === 'case_confirmed' ||
        e.eventName === 'link_copied' ||
        e.eventName === 'embed_copied'
    ).length

    const feedbackEvents = filteredEvents.filter((e) => e.eventName === 'feedback_given')
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
      totalFeedback > 0
        ? Math.round((positiveFeedback / totalFeedback) * 100)
        : positiveFeedback > 0
        ? 100
        : 0

    const FIELD_LABELS = {
      metric: 'Метрика и число',
      problem: 'Проблема («Было»)',
      solution: 'Решение («Сделано»)',
      result: 'Результат («Стало»)',
      quote: 'Цитата клиента',
      author: 'Подпись автора',
      clientLabel: 'Название проекта',
    }

    const fieldCounts = {}
    filteredEvents
      .filter((e) => e.eventName === 'field_edited')
      .forEach((e) => {
        const fieldKey = e.metadata?.field || 'other'
        fieldCounts[fieldKey] = (fieldCounts[fieldKey] || 0) + 1
      })

    const fieldEdits = Object.entries(FIELD_LABELS).map(([field, label]) => ({
      field,
      label,
      count: fieldCounts[field] || 0,
    }))

    const productAnalytics = {
      casesStarted,
      reachedReview,
      casesPublished,
      positiveFeedback,
      negativeFeedback,
      satisfactionRate,
      fieldEdits,
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
      hasEvents: allEvents.length > 0,
    }
  },
})

export const firestoreApplicationRepository = createFirestoreApplicationRepository()
export const firestoreAdminInviteRepository = createFirestoreAdminInviteRepository()
export const firestoreAnalyticsRepository = createFirestoreAnalyticsRepository()

