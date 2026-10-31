import { describe, it, expect } from 'vitest'
import { renderStoryPng, renderCardPng } from '../pngExporter'

describe('pngExporter', () => {
  const sampleData = {
    metric: '-4.8 кг, -6 см',
    metricLabel: 'Снижение веса и объема талии',
    before: 'Боль в пояснице от долгого сидения за компьютером.',
    done: 'Персональные тренировки и занятия по фитнесу в течение месяца.',
    after:
      'Снижение веса на 4.8 кг, уменьшение талии на 6 см, исчезновение болей в пояснице, улучшение самочувствия и смена размера одежды.',
    quote:
      'Главное, поясница перестала болеть от сидения за компом, чувствую себя другим человеком. Джинсы спадают))',
    author: 'Клиент',
    authorRole: 'Постоянный клиент',
    category: 'ФИТНЕС',
    tags: ['Похудение', 'Фитнес'],
    company: '',
    accentColor: '#d6f94c',
  }

  it('renders story canvas with correct dimensions and without throwing', () => {
    const canvas = renderStoryPng(sampleData)
    expect(canvas).toBeDefined()
    expect(canvas.width).toBe(1080)
    expect(canvas.height).toBe(1920)
  })

  it('renders card canvas with correct dimensions and without throwing', () => {
    const canvas = renderCardPng(sampleData)
    expect(canvas).toBeDefined()
    expect(canvas.width).toBe(1200)
    expect(canvas.height).toBeGreaterThanOrEqual(760)
  })

  it('handles empty or missing optional fields gracefully', () => {
    const minimal = {
      metric: '+30%',
      metricLabel: 'рост',
    }
    const storyCanvas = renderStoryPng(minimal)
    const cardCanvas = renderCardPng(minimal)

    expect(storyCanvas.width).toBe(1080)
    expect(cardCanvas.width).toBe(1200)
  })

  it('renders whatsapp variant with chat messages and headline', () => {
    const whatsappData = {
      variant: 'whatsapp',
      headline: 'Было очень круто, и всё понятно!',
      summaryRows: [
        { label: 'Задача', text: 'Сложная тема, интенсивное обучение с нуля' },
        { label: 'Результат', text: 'Всё понятно, занятие прошло круто' },
      ],
      messenger: 'telegram',
      cardMessages: [
        { text: 'но делаются успехи\nреально мозги кипят', side: 'client', time: '19:30' },
        { text: 'Было очень круто, и всё понятно!', side: 'me', time: '19:31' },
      ],
      author: 'Елена К.',
      authorRole: 'Студент курса',
      isVerifiedByChat: true,
      accentColor: '#ffd13b',
    }

    const cardCanvas = renderCardPng(whatsappData)
    const storyCanvas = renderStoryPng(whatsappData)

    expect(cardCanvas).toBeDefined()
    expect(cardCanvas.width).toBe(1200)
    expect(cardCanvas.height).toBeGreaterThanOrEqual(760)

    expect(storyCanvas).toBeDefined()
    expect(storyCanvas.width).toBe(1080)
    expect(storyCanvas.height).toBe(1920)
  })
})
