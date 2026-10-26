import { PLACEHOLDERS } from './placeholders'

export interface BetaOfferFormContent {
  readonly emailLabel: string
  readonly emailPlaceholder: string
  readonly businessTypeLabel: string
  readonly submitButtonText: string
  readonly directContactPrefix: string
  readonly directContactHandle: string
}

export interface BetaOfferContent {
  readonly title: string
  readonly descriptionPrefix: string
  readonly priceNotice: string
  readonly termsNotice: string
  readonly form: BetaOfferFormContent
}

export const BETA_OFFER_CONTENT: BetaOfferContent = Object.freeze({
  title: 'Ищем первые команды для беты',
  descriptionPrefix: 'Дадим ранний доступ бесплатно в обмен на честную обратную связь.',
  priceNotice: `Цена после беты — ${PLACEHOLDERS.priceAfterBeta}`,
  termsNotice: `для участников беты — ${PLACEHOLDERS.betaTerms}.`,
  form: Object.freeze({
    emailLabel: 'Рабочая почта',
    emailPlaceholder: 'you@studio.ru',
    businessTypeLabel: 'Чем вы занимаетесь',
    submitButtonText: 'Оставить заявку',
    directContactPrefix: 'Или напишите напрямую:',
    directContactHandle: PLACEHOLDERS.telegramContact,
  }),
})
