import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PublicCasePage } from '../PublicCasePage'
import * as sharedApi from '@/shared/api'

describe('PublicCasePage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders public case card and verification facts', async () => {
    const mockRepo = {
      getPublicCase: vi.fn(async () => ({
        id: 'case-test-1',
        metric: '+65%',
        metricLabel: 'конверсия в лиды',
        problem: 'Сайт не приносил заявок',
        solution: 'Пересобрали оффер и кейсы',
        result: 'Конверсия выросла до 6.5%',
        quote: 'Очень довольны результатом!',
        author: 'Сергей М.',
        companyName: 'TechCorp',
        selectedVariant: 'dark',
        branding: { showLogo: true, accentColor: '#d6f94c' },
      })),
    }

    vi.spyOn(sharedApi, 'getCaseRepository').mockReturnValue(mockRepo)

    render(
      <MemoryRouter initialEntries={['/c/case-test-1']}>
        <Routes>
          <Route path="/c/:id" element={<PublicCasePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('+65%')).toBeDefined()
    expect(screen.getByText('конверсия в лиды')).toBeDefined()
    expect(screen.getAllByText('Сайт не приносил заявок').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Пересобрали оффер и кейсы').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Конверсия выросла до 6.5%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Проверено по переписке').length).toBeGreaterThanOrEqual(1)
  })

  it('renders unavailable state when case is not published or not found', async () => {
    const mockRepo = {
      getPublicCase: vi.fn(async () => null),
    }

    vi.spyOn(sharedApi, 'getCaseRepository').mockReturnValue(mockRepo)

    render(
      <MemoryRouter initialEntries={['/c/case-missing']}>
        <Routes>
          <Route path="/c/:id" element={<PublicCasePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Кейс недоступен')).toBeDefined()
    expect(
      screen.getByText(
        'Этот кейс не опубликован, был снят с публикации автором или указана неверная ссылка.'
      )
    ).toBeDefined()
  })
})
