export interface ComparisonColumnTitles {
  readonly stage: string
  readonly before: string
  readonly withProofFlow: string
}

export interface ComparisonRow {
  readonly stage: string
  readonly before: string
  readonly withProofFlow: string
  readonly isHighlighted?: boolean
}

export interface ComparisonContent {
  readonly title: string
  readonly columns: ComparisonColumnTitles
  readonly rows: readonly ComparisonRow[]
  readonly summaryRow: ComparisonRow
}

export const COMPARISON_CONTENT: ComparisonContent = Object.freeze({
  title: 'Раньше кейс занимал дни. Теперь — разговор, который у вас уже был.',
  columns: Object.freeze({
    stage: 'ЭТАП',
    before: 'КАК СЕЙЧАС',
    withProofFlow: 'С PROOFFLOW',
  }),
  rows: Object.freeze([
    Object.freeze({
      stage: 'Расшифровка созвона',
      before: 'Вручную или сервисом, потом правки',
      withProofFlow: 'Автоматически, с разметкой по спикерам',
    }),
    Object.freeze({
      stage: 'Цитаты и цифры',
      before: 'Ищете по записи, перематывая',
      withProofFlow: 'Найдены и привязаны к таймкодам',
    }),
    Object.freeze({
      stage: 'Текст кейса',
      before: 'Маркетолог пишет с чистого листа',
      withProofFlow: 'Черновик по схеме «задача — решение — результат»',
    }),
    Object.freeze({
      stage: 'Вёрстка',
      before: 'Отдельная задача дизайнеру',
      withProofFlow: 'Карточка и виджет уже собраны',
    }),
  ]),
  summaryRow: Object.freeze({
    stage: 'Итого',
    before: 'От нескольких дней до недель',
    withProofFlow: 'Около минуты + ваша проверка',
    isHighlighted: true,
  }),
})
