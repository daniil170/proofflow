export const isProduction = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    return true
  }
  if (typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'production') {
    return true
  }
  return false
}

export const assertNoMocksInProduction = () => {
  const isMockRequested =
    typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_USE_MOCK_API === 'true'

  if (isProduction() && isMockRequested) {
    throw new Error(
      'Критическая ошибка конфигурации: в продакшен-сборке запрещено использовать VITE_USE_MOCK_API=true. Отключите мок-режим.'
    )
  }
}
