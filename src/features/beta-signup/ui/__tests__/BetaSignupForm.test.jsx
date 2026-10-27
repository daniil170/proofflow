import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BetaSignupForm } from '../BetaSignupForm.jsx'

describe('BetaSignupForm component', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders email and telegram inputs along with contact hint', () => {
    render(<BetaSignupForm />)

    expect(screen.getByLabelText(/Рабочая почта/i)).toBeDefined()
    expect(screen.getByLabelText(/Telegram/i)).toBeDefined()
    expect(
      screen.getByText(/Напишем вам, когда откроем доступ\. Достаточно одного способа связи/i)
    ).toBeDefined()
  })

  it('shows error when submitted without contacts', async () => {
    const mockGateway = {
      submit: vi.fn(),
    }

    render(<BetaSignupForm gateway={mockGateway} />)

    const submitBtn = screen.getByRole('button', { name: /Отправить заявку на участие в закрытой бете/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/Укажите хотя бы один способ связи/i)).toBeDefined()
    })
    expect(mockGateway.submit).not.toHaveBeenCalled()
  })

  it('submits form with telegram only and renders success screen', async () => {
    const mockGateway = {
      submit: vi.fn().mockResolvedValue({ success: true, id: 'beta-123' }),
    }

    render(<BetaSignupForm gateway={mockGateway} />)

    const tgInput = screen.getByLabelText(/Telegram/i)
    fireEvent.change(tgInput, { target: { value: '@marketing_lead' } })

    const consentCheckbox = screen.getByRole('checkbox', { name: /Даю согласие/i })
    fireEvent.click(consentCheckbox)

    const submitBtn = screen.getByRole('button', { name: /Отправить заявку на участие в закрытой бете/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockGateway.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: null,
          telegramUsername: 'marketing_lead',
          consent: true,
          source: 'web',
        })
      )
      expect(screen.getByText(/Заявка успешно принята!/i)).toBeDefined()
      expect(screen.getByText(/@marketing_lead/i)).toBeDefined()
    })
  })
})
