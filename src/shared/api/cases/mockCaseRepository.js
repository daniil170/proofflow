import { CASE_STATUS, CASE_STORAGE_KEY, INITIAL_EXAMPLE_CASES } from './types.js'

const listeners = new Set()

const loadCases = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }
  try {
    const raw = window.localStorage.getItem(CASE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveCases = (cases) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(cases))
  }
}

let casesStore = loadCases()

const notifyListeners = () => {
  listeners.forEach((record) => {
    if (record.caseId) {
      const found = casesStore.find((item) => item.id === record.caseId)
      record.onUpdate(found ? { ...found } : null)
    } else if (record.onUpdate) {
      const filtered = record.ownerId ? casesStore.filter((item) => item.ownerId === record.ownerId) : casesStore
      const sorted = [...filtered].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      record.onUpdate(sorted)
    }
  })
}

export const mockCaseRepository = Object.freeze({
  subscribeByOwner(ownerId, onUpdate) {
    const listenerRecord = { ownerId, onUpdate }
    listeners.add(listenerRecord)

    queueMicrotask(() => {
      const filtered = ownerId ? casesStore.filter((item) => item.ownerId === ownerId) : casesStore
      const sorted = [...filtered].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      onUpdate(sorted)
    })

    return () => {
      listeners.delete(listenerRecord)
    }
  },

  subscribeById(id, onUpdate) {
    const listenerRecord = { caseId: id, onUpdate }
    listeners.add(listenerRecord)

    queueMicrotask(() => {
      const found = casesStore.find((item) => item.id === id)
      onUpdate(found ? { ...found } : null)
    })

    return () => {
      listeners.delete(listenerRecord)
    }
  },

  async getById(id) {
    const found = casesStore.find((item) => item.id === id)
    return found ? { ...found } : null
  },

  async countByOwner(ownerId) {
    if (!ownerId) return 0
    return casesStore.filter((item) => item.ownerId === ownerId).length
  },

  async create(caseData) {
    const timestamp = Date.now()
    const newCase = {
      id: `mock-case-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...caseData,
    }
    casesStore = [newCase, ...casesStore]
    saveCases(casesStore)
    notifyListeners()
    return newCase
  },

  async update(id, partialData) {
    let updatedItem = null
    casesStore = casesStore.map((item) => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          ...partialData,
          updatedAt: Date.now(),
        }
        return updatedItem
      }
      return item
    })
    saveCases(casesStore)
    notifyListeners()
    return updatedItem
  },

  async seedExamples(ownerId) {
    const timestamp = Date.now()
    const newExamples = INITIAL_EXAMPLE_CASES.map((example, index) => ({
      id: `mock-example-${timestamp}-${index}`,
      ...example,
      ownerId,
      createdAt: timestamp - index * 60000,
      updatedAt: timestamp - index * 60000,
    }))

    casesStore = [...newExamples, ...casesStore]
    saveCases(casesStore)
    notifyListeners()
    return newExamples
  },

  async saveFeedback({ caseId, rating, comment, userId }) {
    const payload = {
      id: `mock-feedback-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      caseId,
      rating,
      comment: comment || '',
      userId: userId || null,
      createdAt: Date.now(),
    }
    return payload
  },

  async publishCase(caseId) {
    const existing = await this.getById(caseId)
    if (!existing) {
      throw new Error('Кейс не найден')
    }

    const draft = existing.draft || {}
    const now = Date.now()
    const publicCase = {
      id: caseId,
      metric: draft.metric?.value || existing.metric || '+40%',
      metricLabel: draft.metric?.label || existing.metricLabel || 'рост конверсии',
      problem: draft.problem || existing.summary || 'Сложности с оформлением кейсов',
      solution: draft.solution || 'Внедрили ProofFlow для автоматизации',
      result: draft.result || 'Получили готовые артефакты за 2 минуты',
      quote: draft.quote?.text || existing.quote || 'Отличный инструмент!',
      author: draft.quote?.authorLabel || existing.author || 'Анна К.',
      authorRole: draft.quote?.authorRole || '',
      tags: draft.tags || ['B2B', 'Кейс'],
      selectedVariant: existing.selectedVariant || 'dark',
      branding: existing.branding || { showLogo: true },
      companyName: existing.branding?.companyName || existing.company || 'ProofFlow',
      title: existing.title || `Кейс: ${draft.metric?.value || ''} ${draft.metric?.label || ''}`.trim(),
      publishedAt: now,
      isVerifiedByChat: true,
      ogImageUrl: null,
    }

    try {
      const publicCasesStr = localStorage.getItem('proofflow_mock_public_cases')
      const publicCases = publicCasesStr ? JSON.parse(publicCasesStr) : {}
      publicCases[caseId] = publicCase
      localStorage.setItem('proofflow_mock_public_cases', JSON.stringify(publicCases))
    } catch {
      window._mockPublicCases = window._mockPublicCases || {}
      window._mockPublicCases[caseId] = publicCase
    }

    await this.update(caseId, {
      status: CASE_STATUS.PUBLISHED,
      publishedAt: now,
      consentConfirmed: true,
    })

    return {
      success: true,
      caseId,
      publicUrl: `${window.location.origin}/c/${caseId}`,
      publicCase,
    }
  },

  async unpublishCase(caseId) {
    try {
      const publicCasesStr = localStorage.getItem('proofflow_mock_public_cases')
      if (publicCasesStr) {
        const publicCases = JSON.parse(publicCasesStr)
        delete publicCases[caseId]
        localStorage.setItem('proofflow_mock_public_cases', JSON.stringify(publicCases))
      }
    } catch {
      if (window._mockPublicCases) {
        delete window._mockPublicCases[caseId]
      }
    }

    await this.update(caseId, {
      status: CASE_STATUS.READY,
      publishedAt: null,
    })

    return { success: true, caseId }
  },

  async delete(caseId) {
    casesStore = casesStore.filter((c) => c.id !== caseId)
    saveCases(casesStore)
    notifyListeners()
    return { success: true, caseId }
  },

  async getPublicCase(caseId) {
    try {
      const publicCasesStr = localStorage.getItem('proofflow_mock_public_cases')
      if (publicCasesStr) {
        const publicCases = JSON.parse(publicCasesStr)
        if (publicCases[caseId]) return publicCases[caseId]
      }
    } catch {
      if (window._mockPublicCases && window._mockPublicCases[caseId]) {
        return window._mockPublicCases[caseId]
      }
    }

    const item = await this.getById(caseId)
    if (item && item.status === CASE_STATUS.PUBLISHED) {
      const draft = item.draft || {}
      return {
        id: item.id,
        metric: draft.metric?.value || item.metric || '+40%',
        metricLabel: draft.metric?.label || item.metricLabel || 'рост конверсии',
        problem: draft.problem || item.summary || 'Сложности с оформлением кейсов',
        solution: draft.solution || 'Внедрили ProofFlow для автоматизации',
        result: draft.result || 'Получили готовые артефакты за 2 минуты',
        quote: draft.quote?.text || item.quote || 'Отличный инструмент!',
        author: draft.quote?.authorLabel || item.author || 'Анна К.',
        authorRole: draft.quote?.authorRole || '',
        tags: draft.tags || ['B2B', 'Кейс'],
        selectedVariant: item.selectedVariant || 'dark',
        branding: item.branding || { showLogo: true },
        companyName: item.branding?.companyName || item.company || 'ProofFlow',
        title: item.title || 'Кейс клиента',
        publishedAt: item.publishedAt || Date.now(),
        isVerifiedByChat: true,
      }
    }

    return null
  },
})
