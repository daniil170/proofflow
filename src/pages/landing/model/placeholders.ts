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
  priceAfterBeta: 'от 4 900 ₽/мес,',
  betaTerms: 'скидка 50% навсегда',
  telegramContact: '@proofflow',
  embedDomain: 'cdn.proofflow.io',
  embedCaseId: 'case_94f8b2',
  clientName: 'Михаил Воронов',
  clientCompanyAndRole: 'Основатель, ДокТур',
})
