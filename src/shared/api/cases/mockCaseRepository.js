import { CASE_STATUS, CASE_STORAGE_KEY, INITIAL_EXAMPLE_CASES } from './types.js'

const listeners = new Set()

const buildContextualDraft = (clientName) => {
  const normalized = (clientName || '').toLowerCase()

  if (
    normalized.includes('b2b') ||
    normalized.includes('saas') ||
    normalized.includes('erp') ||
    normalized.includes('crm') ||
    normalized.includes('софт') ||
    normalized.includes('разработ')
  ) {
    return {
      draft: {
        metric: {
          value: '+42%',
          label: 'ускорение согласований в B2B',
          evidenceId: 'ev-metric-1',
        },
        problem: 'Ручной сбор и согласование проектной отчетности занимали до 18 рабочих часов в неделю.',
        solution: 'Внедрили единый автоматизированный пайплайн сбора пруфов и валидации ключевых метрик.',
        result: 'Время на подготовку отчетности сократилось до 2 часов, прозрачность процессов выросла в разы.',
        quote: {
          text: 'Благодаря автоматизации команда сфокусировалась на ключевых метриках, а клиенты получают отчеты мгновенно.',
          authorLabel: 'Сергей Д.',
          authorRole: 'Операционный директор',
          authorCompany: clientName || 'B2B Enterprise',
          evidenceId: 'ev-quote-1',
        },
        tags: ['B2B', 'Автоматизация', 'Кейс'],
        needsReview: [],
        missingFields: [],
      },
      evidences: [
        {
          id: 'ev-metric-1',
          kind: 'screenshot',
          sourceId: 'src-1',
          excerpt: 'сокращение рутинных операций на 42%',
          label: 'Скриншот аналитики',
        },
        {
          id: 'ev-quote-1',
          kind: 'screenshot',
          sourceId: 'src-2',
          excerpt: 'Благодаря автоматизации команда сфокусировалась на ключевых метриках.',
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
        problem: 'Сложно было донести до новых клиентов экспертность мастеров и стерильность процедур.',
        solution: 'Стали открыто делиться реальными фото работ до/после и собирать живые впечатления сразу после визита.',
        result: 'Плотная запись на 2 недели вперед, 70% новых гостей приходят по рекомендациям.',
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

  const effectiveCompany =
    clientName && clientName !== 'Клиент' ? clientName : 'Мария Торты'

  return {
    draft: {
      metric: {
        value: '5 мин',
        label: 'гости съели торт, ни крошки не осталось',
        evidenceId: 'ev-metric-1',
      },
      problem: 'Нужен был праздничный торт на заказ: важно было, чтобы десерт был умеренно сладким, безупречно оформлен и понравился всем гостям праздника.',
      solution: 'Кондитер «Мария Торты» изготовила двухъярусный торт со свежими ягодами и шоколадным декором в точности по пожеланиям заказчика.',
      result: 'Торт съели за 5 минут без остатка, все гости спрашивали контакты кондитера, а заказчик перешел в статус постоянного клиента.',
      quote: {
        text: 'Торт просто потрясающий! Не слишком сладкий, именно такой, как мы хотели. Гости съели за 5 минут, ни крошки не осталось! Все спрашивали, где мы такую красоту заказали)) Теперь мы ваши постоянные клиенты!',
        authorLabel: 'Анастасия',
        authorRole: 'Постоянный клиент',
        authorCompany: effectiveCompany,
        evidenceId: 'ev-quote-1',
      },
      tags: ['Мария Торты', 'Кондитерская', 'Праздничный торт', 'Отзыв'],
      needsReview: [],
      missingFields: [],
    },
    evidences: [
      {
        id: 'ev-metric-1',
        kind: 'screenshot',
        sourceId: 'src-1',
        excerpt: 'Гости съели за 5 минут, ни крошки не осталось!',
        label: 'Скриншот диалога в Telegram',
      },
      {
        id: 'ev-quote-1',
        kind: 'screenshot',
        sourceId: 'src-2',
        excerpt: 'Торт просто потрясающий! Не слишком сладкий, именно такой, как мы хотели. Все спрашивали, где мы такую красоту заказали)) Теперь мы ваши постоянные клиенты!',
        label: 'Отзыв о праздничном торте',
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
    const cleanPrefix = (str, prefix) => {
      if (!str) return str
      return str.replace(new RegExp(`^${prefix}:\\s*`, 'i'), '')
    }

    return parsed.map((item) => {
      if (item.draft) {
        return {
          ...item,
          draft: {
            ...item.draft,
            problem: cleanPrefix(item.draft.problem, 'было'),
            solution: cleanPrefix(item.draft.solution, 'сделано'),
            result: cleanPrefix(item.draft.result, 'стало'),
          },
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

const analyzeImageWithGemini = async (file, apiKey) => {
  if (!file || !apiKey || typeof FileReader === 'undefined') return null
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const rawResult = String(reader.result || '')
        const base64Data = rawResult.includes(',') ? rawResult.split(',')[1] : rawResult
        const mimeType = file.type || 'image/jpeg'
        const prompt = `Ты — ведущий эксперт ProofFlow по анализу переписок и упаковке кейсов.
Внимательно изучи скриншот переписки в мессенджере (Telegram, WhatsApp и др.).

ПРАВИЛА ОПРЕДЕЛЕНИЯ РОЛЕЙ:
1. В диалоге всегда ДВЕ стороны:
   - ИСПОЛНИТЕЛЬ / ЭКСПЕРТ — тот, чьи услуги оценивают (например, фитнес-тренер, кондитер, маркетолог). Если клиент в сообщении пишет: «Алексей, привет!», значит Алексей — это ЭКСПЕРТ/ТРЕНЕР, а НЕ клиент!
   - КЛИЕНТ / ПОДОПЕЧНЫЙ — автор отзыва, который делится результатами.
2. "author": имя КЛИЕНТА (автора отзыва). Если автор обращается к эксперту («Алексей, привет!»), то имя эксперта ставить в автора КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО. Если имя клиента в переписке не названо, укажи «Клиент» или «Подопечный».
3. "authorRole": статус клиента (например: «Подопечный», «Клиент программы», «Постоянный клиент» или должность в B2B).
4. "authorCompany": компания КЛИЕНТА, если это B2B-кейс. В B2C-услугах (фитнес, репетиторство, торты) оставь пустую строку "". КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать сюда имя эксперта/тренера!
5. "clientLabel": сфера деятельности или ниша проекта одним-двумя словами (например: «Фитнес», «Недвижимость», «Кондитерская»). Без приставок типа «Фитнес-тренер Алексей».

СТИЛЬ ТЕКСТА (ЖИВОЙ ЯЗЫК БЕЗ КАНЦЕЛЯРИТА И МЕДКАРТЫ):
- ЗАПРЕЩЕНЫ бюрократические обороты: «в течение месяца», «проведение занятий», «исчезновение болей», «улучшение показателей», «осуществлен комплекс мер».
- "problem" (Было): живая связка реальной проблемы клиента до обращения (например: «Сидячая работа за компом, ноющая спина и лишний вес»).
- "solution" (Сделано): конкретный фокус действий без воды (например: «Силовые тренировки 3 раза в неделю + адаптация питания под офис без жестких диет»).
- "result" (Стало): качественный жизненный результат и самочувствие (например: «Спина не болит даже после 8 часов за столом, джинсы спадают, много энергии»). ВНИМАНИЕ: НЕ дублируй здесь сухие цифры веса/замеров/денег из заголовка — пиши о качественных переменах!

МЕТРИКА И ЦИТАТА:
- "metricValue": ключевая твердая цифра или показатель (например: «-4.8 кг, -6 см» или «340 ₽» или «+140%»).
- "metricLabel": краткая емкая подпись к цифре (например: «снижение веса и талии» или «стоимость лида»).
- "quote": емкая дословная выжимка самой яркой похвалы или эмоции клиента из диалога (1-2 предложения, строго максимум 150-180 символов, сохраняя эмодзи автора).
- "tags": массив из 2-3 коротких тематических тегов (например: ["Фитнес", "Похудение", "Здоровье"]).

Верни СТРОГО валидный JSON формата:
{
  "clientLabel": "Фитнес",
  "author": "Клиент",
  "authorRole": "Подопечный",
  "authorCompany": "",
  "metricValue": "-4.8 кг, -6 см",
  "metricLabel": "снижение веса и талии",
  "problem": "Сидячая работа за компом, ноющая спина и лишний вес",
  "solution": "Силовые тренировки 3 раза в неделю + адаптация питания под офис без жестких диет",
  "result": "Спина не болит даже после 8 часов за столом, джинсы спадают, много энергии",
  "quote": "Поясница перестала болеть от сидения за компом, чувствую себя другим человеком. Джинсы спадают))",
  "tags": ["Фитнес", "Похудение"]
}`

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { inline_data: { mime_type: mimeType, data: base64Data } },
                    { text: prompt },
                  ],
                },
              ],
              generationConfig: { response_mime_type: 'application/json' },
            }),
          }
        )

        if (!res.ok) {
          resolve(null)
          return
        }

        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) {
          resolve(null)
          return
        }

        const parsed = JSON.parse(text)
        resolve(parsed)
      } catch {
        resolve(null)
      }
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
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
      const imageSource = (caseData.sources || []).find(
        (s) => s.file instanceof Blob && s.file.type.startsWith('image/')
      )
      const apiKey =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || ''

      const updateCase = (patch) => {
        casesStore = casesStore.map((c) =>
          c.id === caseId ? { ...c, ...patch, updatedAt: Date.now() } : c
        )
        saveCases(casesStore)
        notifyListeners()
      }

      if (imageSource && apiKey) {
        setTimeout(() => {
          updateCase({
            stage: 'transcribing',
            stageProgress: 30,
            stageMessage: 'Анализ аудиодорожек и распознавание речи...',
          })
        }, 600)

        setTimeout(() => {
          updateCase({
            stage: 'reading',
            stageProgress: 55,
            stageMessage: 'Мультимодальное сканирование скриншота диалога (Vision AI)...',
          })
        }, 1300)

        setTimeout(() => {
          updateCase({
            stage: 'analyzing',
            stageProgress: 75,
            stageMessage: 'Выделение ключевой метрики, проблемы и решения...',
          })
        }, 2000)

        analyzeImageWithGemini(imageSource.file, apiKey)
          .then((aiResult) => {
            const current = casesStore.find((c) => c.id === caseId) || newCase
            if (aiResult) {
              const resolvedClient = aiResult.clientLabel || current.clientLabel || 'Клиент'
              updateCase({
                clientLabel: resolvedClient,
                title: `Кейс для ${resolvedClient}`,
                stage: 'verifying',
                stageProgress: 92,
                stageMessage: 'Верификация дословной цитаты и проверка доказательств...',
                draft: {
                  ...current.draft,
                  metric: {
                    value: String(aiResult.metricValue || current.draft?.metric?.value || ''),
                    label: String(aiResult.metricLabel || current.draft?.metric?.label || ''),
                    evidenceId: 'ev-metric-1',
                  },
                  problem: aiResult.problem || current.draft?.problem,
                  solution: aiResult.solution || current.draft?.solution,
                  result: aiResult.result || current.draft?.result,
                  quote: {
                    ...current.draft?.quote,
                    text: aiResult.quote || current.draft?.quote?.text,
                    authorLabel: aiResult.author || current.draft?.quote?.authorLabel || 'Клиент',
                    authorRole: aiResult.authorRole || current.draft?.quote?.authorRole || 'Клиент',
                    authorCompany: aiResult.authorCompany || '',
                  },
                  tags:
                    Array.isArray(aiResult.tags) && aiResult.tags.length > 0
                      ? aiResult.tags
                      : current.draft?.tags,
                },
              })
            } else {
              updateCase({
                stage: 'verifying',
                stageProgress: 92,
                stageMessage: 'Верификация дословной цитаты и проверка доказательств...',
              })
            }

            setTimeout(() => {
              updateCase({
                stage: 'done',
                stageProgress: 100,
                stageMessage: 'Карточка кейса собрана и готова к проверке!',
                status: 'review',
              })
            }, 700)
          })
          .catch(() => {
            updateCase({
              stage: 'done',
              stageProgress: 100,
              stageMessage: 'Карточка кейса собрана и готова к проверке!',
              status: 'review',
            })
          })
      } else {
        const steps = [
          { stage: 'transcribing', progress: 30, msg: 'Анализ аудиодорожек и распознавание речи...' },
          { stage: 'reading', progress: 55, msg: 'Мультимодальное сканирование скриншота диалога (Vision AI)...' },
          { stage: 'analyzing', progress: 75, msg: 'Выделение ключевой метрики, проблемы и решения...' },
          { stage: 'verifying', progress: 92, msg: 'Верификация дословной цитаты и проверка доказательств...' },
          { stage: 'done', progress: 100, msg: 'Карточка кейса собрана и готова к проверке!', status: 'review' },
        ]

        let delay = 600
        for (const step of steps) {
          setTimeout(() => {
            updateCase({
              status: step.status || 'processing',
              stage: step.stage,
              stageProgress: step.progress,
              stageMessage: step.msg,
            })
          }, delay)
          delay += 700
        }
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
