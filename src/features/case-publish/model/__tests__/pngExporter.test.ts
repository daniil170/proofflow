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
})
