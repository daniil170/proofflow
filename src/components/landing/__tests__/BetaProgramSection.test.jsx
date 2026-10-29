import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import BetaProgramSection from '../BetaProgramSection'

describe('BetaProgramSection component', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders title, badge/eyebrow, and subtitle correctly', () => {
    render(<BetaProgramSection />)

    expect(screen.getByText(/ЗАКРЫТЫЙ БЕТА-ТЕСТ · FOUNDER-ONBOARDING/i)).toBeDefined()
    expect(
      screen.getByRole('heading', { level: 2, name: /Как устроен закрытый бета-тест/i })
    ).toBeDefined()
    expect(
      screen.getByText(/Мы не отправляем вас разбираться в пустом кабинете в одиночку/i)
    ).toBeDefined()
  })

  it('renders all 4 steps with badges, titles and descriptions', () => {
    render(<BetaProgramSection />)

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /Шаг 1: 15 минут в Zoom — первый кейс «под ключ»/i,
      })
    ).toBeDefined()
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /Шаг 2: 7 дней полного безлимитного доступа/i,
      })
    ).toBeDefined()
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /Шаг 3: Персональная прямая линия в Telegram/i,
      })
    ).toBeDefined()
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /Шаг 4: Пожизненная скидка 20% для первых 10 участников/i,
      })
    ).toBeDefined()

    expect(screen.getByText(/Подключаемся вместе с фаундером/i)).toBeDefined()
    expect(
      screen.getByText(/Вы получаете закрытый доступ ко всем 4 форматам карточек/i)
    ).toBeDefined()
    expect(screen.getByText(/Никаких ботов поддержки и тикетов/i)).toBeDefined()
    expect(screen.getByText(/В конце недели — короткий созвон на 10 минут/i)).toBeDefined()
  })

  it('renders micro-CTA block with quota, micro-copy, and action button', () => {
    render(<BetaProgramSection />)

    expect(screen.getByText(/Осталось мест в первой когорте:/i)).toBeDefined()
    expect(screen.getByText('[10 / 10]')).toBeDefined()
    expect(
      screen.getByText(
        /Требование к участнику: наличие архива переписок\/отзывов и готовность к 15-минутному звонку\./i
      )
    ).toBeDefined()

    const ctaButton = screen.getByRole('link', { name: /Подать заявку на бета-тест/i })
    expect(ctaButton).toBeDefined()
  })

  it('triggers smooth scroll when clicking CTA button', () => {
    const scrollIntoViewMock = vi.fn()
    const targetElement = document.createElement('div')
    targetElement.id = 'beta-form'
    targetElement.scrollIntoView = scrollIntoViewMock
    document.body.appendChild(targetElement)

    render(<BetaProgramSection />)
    const ctaButton = screen.getByRole('link', { name: /Подать заявку на бета-тест/i })
    fireEvent.click(ctaButton)

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
    document.body.removeChild(targetElement)
  })

  it('contains standard Tailwind responsive grid classes', () => {
    const { container } = render(<BetaProgramSection />)
    const gridEl = container.querySelector('.grid')
    expect(gridEl).toBeDefined()
    expect(gridEl?.className).toContain('grid-cols-1')
    expect(gridEl?.className).toContain('md:grid-cols-2')
    expect(gridEl?.className).toContain('lg:grid-cols-4')
  })
})
