export const parseHexColor = (hex) => {
  if (!hex || typeof hex !== 'string') return null
  let clean = hex.trim().replace(/^#/, '')
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('')
  }
  if (clean.length !== 6) return null
  const num = parseInt(clean, 16)
  if (Number.isNaN(num)) return null
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

export const getRelativeLuminance = ({ r, g, b }) => {
  const rs = r / 255
  const gs = g / 255
  const bs = b / 255

  const rLin = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4)
  const gLin = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4)
  const bLin = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4)

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

export const calculateContrastRatio = (foregroundHex, backgroundHex = '#0d1714') => {
  const fgRgb = parseHexColor(foregroundHex)
  const bgRgb = parseHexColor(backgroundHex)

  if (!fgRgb || !bgRgb) {
    return {
      ratio: 1,
      isValid: false,
      isAccessible: false,
      rating: 'Fail',
      scoreText: 'Неверный hex-код',
    }
  }

  const l1 = getRelativeLuminance(fgRgb)
  const l2 = getRelativeLuminance(bgRgb)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  const ratio = (lighter + 0.05) / (darker + 0.05)
  const roundedRatio = Math.round(ratio * 10) / 10

  const isAccessible = roundedRatio >= 3.0
  let rating = 'Fail'
  let scoreText = 'Низкий контраст (< 3:1)'

  if (roundedRatio >= 7.0) {
    rating = 'AAA'
    scoreText = 'Отличный контраст (AAA)'
  } else if (roundedRatio >= 4.5) {
    rating = 'AA'
    scoreText = 'Хороший контраст (AA)'
  } else if (roundedRatio >= 3.0) {
    rating = 'AA Large'
    scoreText = 'Достаточный для крупных текстов'
  }

  return {
    ratio: roundedRatio,
    isValid: true,
    isAccessible,
    rating,
    scoreText,
  }
}

export const ACCENT_COLOR_TOKENS = [
  { label: 'Лайм', hex: '#d6f94c' },
  { label: 'Электрик', hex: '#3b82f6' },
  { label: 'Изумруд', hex: '#10b981' },
  { label: 'Фиолетовый', hex: '#8b5cf6' },
  { label: 'Оранж', hex: '#f97316' },
  { label: 'Розовый', hex: '#ec4899' },
  { label: 'Белый', hex: '#ffffff' },
]

export const VARIANT_BACKGROUND_COLORS = {
  dark: '#0d1714',
  newspaper: '#f4ede2',
  whatsapp: '#0b141a',
  receipt: '#f9fafb',
  minimal: '#ffffff',
}
