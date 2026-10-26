export interface HeroDialogueItem {
  readonly time: string
  readonly speaker: string
  readonly text: string
  readonly isHighlighted?: boolean
}

export interface HeroTranscriptPreview {
  readonly filename: string
  readonly duration: string
  readonly status: string
  readonly dialogue: readonly HeroDialogueItem[]
}

export interface HeroCaseMetric {
  readonly label: string
  readonly value: string
  readonly isHighlighted?: boolean
}

export interface HeroCasePreview {
  readonly status: string
  readonly title: string
  readonly before: HeroCaseMetric
  readonly after: HeroCaseMetric
  readonly result: HeroCaseMetric
}

export interface HeroContent {
  readonly badge: string
  readonly title: string
  readonly titleHighlight: string
  readonly subtitle: string
  readonly primaryButtonText: string
  readonly secondaryButtonText: string
  readonly audienceLabel: string
  readonly audienceList: readonly string[]
  readonly transcriptPreview: HeroTranscriptPreview
  readonly casePreview: HeroCasePreview
}

export const HERO_CONTENT: HeroContent = Object.freeze({
  badge: 'Закрытая бета · агентства, студии, фрилансеры',
  title: 'Созвон с клиентом уже был. Кейс —',
  titleHighlight: 'через минуту.',
  subtitle:
    'Загрузите запись Zoom или Google Meet. ProofFlow найдёт в разговоре задачу, решение и результат, вытащит слова клиента с таймкодами — и соберёт готовый кейс и виджет для сайта.',
  primaryButtonText: 'Попасть в бету',
  secondaryButtonText: 'Как это работает',
  audienceLabel: 'Для тех, кто делает работу для клиентов:',
  audienceList: Object.freeze([
    'Маркетинговые агентства',
    'Веб-студии',
    'IT-аутсорс',
    'Консалтинг',
    'Фрилансеры',
  ]),
  transcriptPreview: Object.freeze({
    filename: 'call_klinika-doctur.mp4',
    duration: '47:12',
    status: 'готово',
    dialogue: Object.freeze([
      {
        time: '05:14',
        speaker: 'Клиент',
        text: 'Да мы вообще сайты производствами верстали, и то случайными',
      },
      {
        time: '11:12',
        speaker: 'Вы',
        text: 'Мы убрали прайс на шесть экранов и сделали запись в два клика.',
      },
      {
        time: '35:48',
        speaker: 'Клиент',
        text: 'Через месяц после запуска записи пошли по три-четыре в день.',
        isHighlighted: true,
      },
    ]),
  }),
  casePreview: Object.freeze({
    status: 'Кейс · готов к публикации',
    title: 'Новый сайт для сети клиник: запись онлайн вместо звонков',
    before: Object.freeze({
      label: 'было',
      value: 'Заявки только по звонку',
    }),
    after: Object.freeze({
      label: 'стало',
      value: 'Запись за 2 клика',
    }),
    result: Object.freeze({
      label: 'результат',
      value: '3-4 записи в день',
      isHighlighted: true,
    }),
  }),
})
