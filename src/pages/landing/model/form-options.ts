export interface BusinessTypeOption {
  readonly value: string
  readonly label: string
}

export const BUSINESS_TYPE_OPTIONS: readonly BusinessTypeOption[] = Object.freeze([
  Object.freeze({
    value: 'agency_or_studio',
    label: 'Агентство или студия',
  }),
  Object.freeze({
    value: 'marketing_agency',
    label: 'Маркетинговое агентство',
  }),
  Object.freeze({
    value: 'web_studio',
    label: 'Веб-студия',
  }),
  Object.freeze({
    value: 'it_outsource',
    label: 'IT-аутсорс',
  }),
  Object.freeze({
    value: 'consulting',
    label: 'Консалтинг',
  }),
  Object.freeze({
    value: 'freelance',
    label: 'Фрилансер / Инди-мейкер',
  }),
])
