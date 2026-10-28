import { CASE_STATUS, CASE_STORAGE_KEY, INITIAL_EXAMPLE_CASES } from './types.js'

const listeners = new Set()

const buildContextualDraft = (clientName) => {
  const normalized = (clientName || '').toLowerCase()

  if (
    normalized.includes('кондитер') ||
    normalized.includes('торт') ||
    normalized.includes('десерт') ||
    normalized.includes('пекарн') ||
    normalized.includes('выпечк') ||
    normalized.includes('сладк') ||
    normalized.includes('кафе')
  ) {
    return {
      draft: {
        metric: {
          value: '+85%',
          label: 'повторных заказов и рекомендаций',
          evidenceId: 'ev-metric-1',
        },
        problem: 'Было: Клиенты часто сомневались при выборе сложных начинок и оформления заказных тортов без предварительной дегустации.',
        solution: 'Сделано: Ввели подробные фото-согласования дизайна десертов в переписке и дегустационные сеты начинок.',
        result: 'Стало: Заказы закрываются за 15 минут прямо в диалоге, средний чек на праздничные торты вырос в 1.5 раза.',
        quote: {
          text: 'Торт превзошел все наши ожидания! Гости на юбилее съели всё до крошки, крем нежнейший, оформление — шедевр.',
          authorLabel: 'Мария К.',
          authorRole: 'Постоянный заказчик',
          authorCompany: clientName,
          evidenceId: 'ev-quote-1',
        },
        tags: ['Кондитерская', 'Десерты', 'Отзыв'],
        needsReview: [],
        missingFields: [],
      },
      evidences: [
        {
          id: 'ev-metric-1',
          kind: 'screenshot',
          sourceId: 'src-1',
          excerpt: 'клиенты заказывают десерты повторно более чем в 85% случаев',
          label: 'Скриншот переписки',
        },
        {
          id: 'ev-quote-1',
          kind: 'screenshot',
          sourceId: 'src-2',
          excerpt: 'Торт превзошел все наши ожидания! Гости на юбилее съели всё до крошки.',
          label: 'Скриншот отзыва',
        },
      ],
    }
  }

  if (
    normalized.includes('салон') ||
    normalized.includes('красот') ||
    normalized.includes('барбер') ||
    normalized.includes('маникюр')
  ) {
    return {
      draft: {
        metric: {
          value: '4.9 ★',
          label: 'рейтинг на основе 140 отзывов',
          evidenceId: 'ev-metric-1',
        },
        problem: 'Было: Сложно было донести до новых клиентов экспертность мастеров и стерильность процедур.',
        solution: 'Сделано: Стали открыто делиться реальными фото работ до/после и собирать живые впечатления сразу после визита.',
        result: 'Стало: Плотная запись на 2 недели вперед, 70% новых гостей приходят по рекомендациям.',
        quote: {
          text: 'Хожу только к вам уже второй год! Всегда безупречный результат, чистота и очень приятная атмосфера.',
          authorLabel: 'Алина В.',
          authorRole: 'Постоянный клиент',
          authorCompany: clientName,
          evidenceId: 'ev-quote-1',
        },
        tags: ['Beauty', 'Услуги', 'Отзыв'],
        needsReview: [],
        missingFields: [],
      },
      evidences: [
        {
          id: 'ev-metric-1',
          kind: 'screenshot',
          sourceId: 'src-1',
          excerpt: 'рейтинг 4.9 на основе более 140 подтвержденных визитов',
          label: 'Скриншот отзывов',
        },
        {
          id: 'ev-quote-1',
          kind: 'screenshot',
          sourceId: 'src-2',
          excerpt: 'Хожу только к вам уже второй год! Всегда безупречный результат.',
          label: 'Отзыв в мессенджере',
        },
      ],
    }
  }

  return {
    draft: {
      metric: {
        value: '+120%',
        label: 'рост доверия и рекомендаций',
        evidenceId: 'ev-metric-1',
      },
      problem: 'Было: Сложно было наглядно показать новым заказчикам качество работы и реальные результаты предыдущих проектов.',
      solution: 'Сделано: Упаковали реальные переписки и отзывы в интерактивные карточки с подтверждёнными цитатами.',
      result: 'Стало: Доверие на первом контакте выросло в разы, цикл принятия решения сократился в 2 раза.',
      quote: {
        text: 'Очень приятно работать с профессионалами, всё сделано точно в срок и превзошло наши ожидания.',
        authorLabel: 'Алексей М.',
        authorRole: 'Заказчик',
        authorCompany: clientName,
        evidenceId: 'ev-quote-1',
      },
      tags: [clientName || 'Клиент', 'Результат', 'Отзыв'],
      needsReview: [],
      missingFields: [],
    },
    evidences: [
      {
        id: 'ev-metric-1',
        kind: 'screenshot',
        sourceId: 'src-1',
        excerpt: 'рост доверия и повторных обращений более чем на 120%',
        label: 'Скриншот диалога',
      },
      {
        id: 'ev-quote-1',
        kind: 'screenshot',
        sourceId: 'src-2',
        excerpt: 'Очень приятно работать с профессионалами, всё сделано точно в срок.',
        label: 'Подтверждённая цитата',
      },
    ],
  }
}

const loadCases = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }
  try {
    const raw = window.localStorage.getItem(CASE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => {
      const clientName = (item.clientLabel || item.client || '').toLowerCase()
      if (
        (clientName.includes('кондитер') || clientName.includes('торт')) &&
        item.draft?.problem?.includes('сбор и согласование отчетов')
      ) {
        const contextual = buildContextualDraft(item.clientLabel || 'Кондитерская')
        return {
          ...item,
          draft: contextual.draft,
          evidences: contextual.evidences,
        }
      }
      return item
    })
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
    const caseId = `mock-case-${Math.random().toString(36).substring(2, 9)}`
    const clientName = caseData.clientLabel || 'Клиент'

    const contextual = buildContextualDraft(clientName)
    const generatedDraft = contextual.draft
    const generatedEvidences = contextual.evidences

    const newCase = {
      id: caseId,
      createdAt: timestamp,
      updatedAt: timestamp,
      stage: 'preparing',
      stageProgress: 15,
      stageMessage: 'Подготовка и нормализация источников',
      ...caseData,
      draft: caseData.draft || generatedDraft,
      evidences: caseData.evidences || generatedEvidences,
    }

    casesStore = [newCase, ...casesStore]
    saveCases(casesStore)
    notifyListeners()

    if (newCase.status === 'processing') {
      const steps = [
        { stage: 'transcribing', progress: 35, msg: 'Расшифровка аудио и видео' },
        { stage: 'reading', progress: 55, msg: 'Извлечение сообщений из скриншотов' },
        { stage: 'analyzing', progress: 75, msg: 'Сборка структуры кейса' },
        { stage: 'verifying', progress: 90, msg: 'Проверка фактов и цитат' },
        { stage: 'done', progress: 100, msg: 'Готово к проверке', status: 'review' },
      ]

      let delay = 400
      for (const step of steps) {
        setTimeout(() => {
          casesStore = casesStore.map((c) =>
            c.id === caseId
              ? {
                  ...c,
                  status: step.status || 'processing',
                  stage: step.stage,
                  stageProgress: step.progress,
                  stageMessage: step.msg,
                  updatedAt: Date.now(),
                }
              : c
          )
          saveCases(casesStore)
          notifyListeners()
        }, delay)
        delay += 500
      }
    }

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

  async deleteByOwner(ownerId) {
    if (!ownerId) return { success: true, count: 0 }
    const beforeCount = casesStore.length
    casesStore = casesStore.filter((c) => c.ownerId !== ownerId)
    saveCases(casesStore)
    notifyListeners()
    return { success: true, count: beforeCount - casesStore.length }
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
