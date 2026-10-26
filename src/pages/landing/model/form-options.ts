export interface BusinessTypeOption {
  readonly value: string
  readonly label: string
}

export interface CasesVolumeOption {
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

export const CASES_VOLUME_OPTIONS: readonly CasesVolumeOption[] = Object.freeze([
  Object.freeze({
    value: '1_to_3',
    label: '1–3 кейса в месяц',
  }),
  Object.freeze({
    value: '4_to_10',
    label: '4–10 кейсов в месяц',
  }),
  Object.freeze({
    value: '10_to_30',
    label: '10–30 кейсов в месяц',
  }),
  Object.freeze({
    value: 'more_than_30',
    label: 'Более 30 кейсов в месяц',
  }),
])
