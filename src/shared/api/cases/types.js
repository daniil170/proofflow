export const CASE_STATUS = Object.freeze({
  PROCESSING: 'processing',
  REVIEW: 'review',
  READY: 'ready',
  DRAFT: 'draft',
  PUBLISHED: 'published',
  FAILED: 'failed',
})

export const CASE_STATUS_LABELS = Object.freeze({
  [CASE_STATUS.PROCESSING]: 'Обработка',
  [CASE_STATUS.REVIEW]: 'На проверке',
  [CASE_STATUS.READY]: 'Готов к публикации',
  [CASE_STATUS.DRAFT]: 'Черновик',
  [CASE_STATUS.PUBLISHED]: 'Опубликован',
  [CASE_STATUS.FAILED]: 'Ошибка',
})

export const CASE_STORAGE_KEY = 'proofflow_cases_store'

export const INITIAL_EXAMPLE_CASES = [
  {
    title: 'Автоматизация лидогенерации для B2B-интегратора',
    client: 'Nordic Tech Solutions',
    status: CASE_STATUS.PUBLISHED,
    metric: '+180%',
    metricLabel: 'рост целевых лидов',
    summary: 'Автоматический парсинг созвонов сейлзов с конвертацией в живые кейсы за 48 часов.',
    slug: 'nordic-tech-solutions',
    sourceType: 'audio',
    quote: 'Раньше упаковка одного кейса занимала две недели, теперь — 15 минут.',
    author: 'Максим Белов, CEO',
  },
  {
    title: 'Сокращение времени онбординга клиентов в 3 раза',
    client: 'FinFlow SaaS',
    status: CASE_STATUS.REVIEW,
    metric: '3x',
    metricLabel: 'быстрее внедрение',
    summary: 'Транскрибация клиентских интервью и сборка интерактивных карточек внедрения.',
    slug: 'finflow-saas',
    sourceType: 'video',
    quote: 'Клиенты сами пересылают наши карточки своим партнерам.',
    author: 'Анна Воронова, Head of CS',
  },
  {
    title: 'Анализ серии глубинных созвонов с клиентами',
    client: 'MediaPulse Agency',
    status: CASE_STATUS.PROCESSING,
    metric: '14 созвонов',
    metricLabel: 'обработано в очереди',
    summary: 'Выделение сильных цитат и метрик эффективности рекламных кампаний.',
    slug: 'mediapulse-agency',
    sourceType: 'audio',
    quote: 'Качественная выжимка смыслов без рутинного переслушивания.',
    author: 'Сергей Кравцов, Тимлид',
  },
  {
    title: 'Черновик: Редизайн интерфейса онлайн-платформы',
    client: 'EdTech Pro',
    status: CASE_STATUS.DRAFT,
    metric: '+42%',
    metricLabel: 'NPS пользователей',
    summary: 'Подготовка структуры кейса и сверка первичных метрик с заказчиком.',
    slug: 'edtech-pro',
    sourceType: 'text',
    quote: 'Инструмент позволил структурировать мысли клиента без лишней воды.',
    author: 'Елена Морозова, Product Designer',
  },
]
