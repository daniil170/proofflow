export interface FaqItem {
  readonly id: string
  readonly question: string
  readonly answer: string
}

export interface FaqContent {
  readonly title: string
  readonly items: readonly FaqItem[]
}

export const FAQ_CONTENT: FaqContent = Object.freeze({
  title: 'Частые вопросы',
  items: Object.freeze([
    Object.freeze({
      id: 'privacy',
      question: 'Что с конфиденциальностью записей?',
      answer:
        'Вы сами решаете, что загружать и что публиковать. Перед записью и публикацией нужно согласие клиента. Подробные условия обработки данных мы определим до запуска беты и сообщим участникам заранее.',
    }),
    Object.freeze({
      id: 'editing',
      question: 'Можно ли править результат?',
      answer:
        'Да. Ничего не публикуется без вашей проверки: вы видите и правите текст, цитаты и цифры перед публикацией.',
    }),
    Object.freeze({
      id: 'languages',
      question: 'Работает ли на русском?',
      answer:
        'Для расшифровки используется модель с поддержкой русского. Качество на реальных записях проверим вместе с первыми участниками беты.',
    }),
    Object.freeze({
      id: 'inputs',
      question: 'Что нужно загрузить?',
      answer:
        'Запись созвона в Zoom или Google Meet, голосовое сообщение, запись экрана или скриншоты переписки.',
    }),
  ]),
})
