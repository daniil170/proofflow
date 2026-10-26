export interface PlaceholdersConfig {
  readonly priceAfterBeta: string
  readonly betaTerms: string
  readonly telegramContact: string
  readonly embedDomain: string
  readonly embedCaseId: string
  readonly clientName: string
  readonly clientCompanyAndRole: string
}

export const PLACEHOLDERS: PlaceholdersConfig = Object.freeze({
  priceAfterBeta: '[ЦЕНА]',
  betaTerms: '[УСЛОВИЯ]',
  telegramContact: '[TELEGRAM]',
  embedDomain: '[ДОМЕН]',
  embedCaseId: '[ID-КЕЙСА]',
  clientName: '[Имя клиента]',
  clientCompanyAndRole: '[Должность, компания]',
})
