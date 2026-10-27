import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EvidenceDrawer } from '../EvidenceDrawer.jsx'

describe('EvidenceDrawer', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders deleted source notice and saved quote when sourcesDeletedAt is set', () => {
    const activeEvidence = {
      fieldName: 'metric',
      evidence: {
        id: 'ev-1',
        kind: 'transcriptSegment',
        exactQuote: 'Конверсия выросла на 140%',
      },
      source: {
        id: 'src-1',
        kind: 'audio',
      },
      sourcesDeletedAt: '2026-10-20T10:00:00.000Z',
    }

    render(<EvidenceDrawer activeEvidence={activeEvidence} onClose={vi.fn()} />)

    expect(screen.getByText('Метрика и результат')).toBeDefined()
    expect(screen.getByText('Исходный файл удалён по сроку хранения')).toBeDefined()
    expect(screen.getByText('Срок хранения истёк')).toBeDefined()
    expect(screen.getByText('«Конверсия выросла на 140%»')).toBeDefined()
    expect(screen.queryByText('Слушать фрагмент')).toBeNull()
  })

  it('renders audio playback controls when source is active and not deleted', () => {
    const activeEvidence = {
      fieldName: 'quote',
      evidence: {
        id: 'ev-2',
        kind: 'transcriptSegment',
        exactQuote: 'Команда довольна новой системой.',
      },
      source: {
        id: 'src-2',
        kind: 'audio',
      },
      sourcesDeletedAt: null,
    }

    render(<EvidenceDrawer activeEvidence={activeEvidence} onClose={vi.fn()} />)

    expect(screen.getByText('Цитата клиента')).toBeDefined()
    expect(screen.queryByText('Исходный файл удалён по сроку хранения')).toBeNull()
    expect(screen.getByText('Слушать фрагмент')).toBeDefined()
    expect(screen.getByText('«Команда довольна новой системой.»')).toBeDefined()
  })

  it('renders deleted notice for screenshot evidence when sourcesDeletedAt is present', () => {
    const activeEvidence = {
      fieldName: 'problem',
      evidence: {
        id: 'ev-3',
        kind: 'chatMessage',
        exactQuote: 'Клиенты жаловались на долгий ответ.',
      },
      source: {
        id: 'src-3',
        kind: 'screenshot',
      },
      sourcesDeletedAt: '2026-10-15T00:00:00.000Z',
    }

    render(<EvidenceDrawer activeEvidence={activeEvidence} onClose={vi.fn()} />)

    expect(screen.getByText('Раздел «Было»')).toBeDefined()
    expect(screen.getByText('Исходный файл удалён по сроку хранения')).toBeDefined()
    expect(screen.getByText('«Клиенты жаловались на долгий ответ.»')).toBeDefined()
    expect(screen.queryByText('Оригинал скриншота:')).toBeNull()
  })
})
