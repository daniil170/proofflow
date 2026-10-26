export interface StepItem {
  readonly number: string
  readonly title: string
  readonly description: string
}

export interface StepsContent {
  readonly title: string
  readonly subtitle: string
  readonly items: readonly StepItem[]
}

export const STEPS_CONTENT: StepsContent = Object.freeze({
  title: 'Три шага от записи до кейса на сайте',
  subtitle:
    'Вы не пишете кейс с нуля и не пересматриваете часовой созвон. Вы проверяете черновик, собранный из слов клиента.',
  items: Object.freeze([
    Object.freeze({
      number: '01',
      title: 'Загрузите запись',
      description:
        'Видео или аудио созвона, голосовое от клиента, запись экрана или скриншоты переписки.',
    }),
    Object.freeze({
      number: '02',
      title: 'Проверьте выжимку',
      description:
        'Задача, решение, результат и цитаты — у каждой фразы таймкод, чтобы за секунду сверить с записью.',
    }),
    Object.freeze({
      number: '03',
      title: 'Опубликуйте',
      description:
        'Текстовый кейс для блога и карточка-виджет, которая встаёт на сайт одной строчкой кода.',
    }),
  ]),
})
