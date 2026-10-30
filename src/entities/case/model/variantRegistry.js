export const VARIANT_LABELS_REGISTRY = Object.freeze({
  whatsapp: Object.freeze(['Задача', 'Контекст', 'Процесс', 'Результат', 'Впечатление', 'Сомнение']),
  dark: Object.freeze(['Было', 'Сделано', 'Стало', 'Контекст', 'Результат', 'Задача']),
  newspaper: Object.freeze(['Было', 'Сделано', 'Стало', 'Контекст', 'Результат']),
  receipt: Object.freeze(['ЗАДАЧА', 'КОНТЕКСТ', 'РЕШЕНИЕ', 'РЕЗУЛЬТАТ', 'СРОК', 'ИТОГО']),
  minimal: Object.freeze(['было', 'сделано', 'стало', 'контекст', 'результат', 'задача']),
})

export const DEFAULT_ALLOWED_LABELS = Object.freeze([
  'Задача',
  'Было',
  'Сделано',
  'Стало',
  'Контекст',
  'Результат',
  'Процесс',
  'Впечатление',
])

export const getAllowedLabelsForVariant = (variant) => {
  return VARIANT_LABELS_REGISTRY[variant] || DEFAULT_ALLOWED_LABELS
}

export const isLabelAllowedForVariant = (label, variant) => {
  if (!label) return false
  const allowed = getAllowedLabelsForVariant(variant)
  const normalized = label.trim().toLowerCase()
  return allowed.some((item) => item.toLowerCase() === normalized)
}

export const normalizeLabelForVariant = (label, variant) => {
  if (!label) return ''
  const allowed = getAllowedLabelsForVariant(variant)
  const normalized = label.trim().toLowerCase()
  const matched = allowed.find((item) => item.toLowerCase() === normalized)
  return matched || label.trim()
}
