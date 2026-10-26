import { PLACEHOLDERS } from './placeholders'

export interface TrustWidgetAuthor {
  readonly name: string
  readonly roleAndCompany: string
}

export interface TrustWidgetPreview {
  readonly headerNote: string
  readonly badge: string
  readonly quote: string
  readonly author: TrustWidgetAuthor
  readonly listenActionText: string
  readonly verifiedBadgeText: string
}

export interface TrustContent {
  readonly badge: string
  readonly title: string
  readonly description: string
  readonly embedCodeSnippet: string
  readonly widgetPreview: TrustWidgetPreview
}

export const TRUST_CONTENT: TrustContent = Object.freeze({
  badge: 'Виджет социального доказательства',
  title: 'Отзыв, которому верят: со ссылкой на сам разговор',
  description:
    'Каждая цитата на карточке ведёт к моменту записи, где клиент это сказал. Посетитель видит не текст от маркетолога, а слова живого человека.',
  embedCodeSnippet: `<script src="https://${PLACEHOLDERS.embedDomain}/embed.js" data-case="${PLACEHOLDERS.embedCaseId}"></script>`,
  widgetPreview: Object.freeze({
    headerNote: 'Так виджет выглядит на вашем сайте',
    badge: 'пример',
    quote: '«Через месяц после запуска записи пошли по три-четыре в день.»',
    author: Object.freeze({
      name: PLACEHOLDERS.clientName,
      roleAndCompany: PLACEHOLDERS.clientCompanyAndRole,
    }),
    listenActionText: 'Послушать в записи · 35:48',
    verifiedBadgeText: 'Verified by ProofFlow',
  }),
})
