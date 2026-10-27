import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WaitlistScreen } from '../WaitlistScreen.jsx'
import * as useAuthModule from '../../model/useAuth.js'

describe('WaitlistScreen', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders waitlist information and handles successful code redemption', async () => {
    const redeemInvite = vi.fn().mockResolvedValue({ success: true, accessStatus: 'active' })
    const onActivated = vi.fn()

    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      redeemInvite,
      logout: vi.fn(),
    })

    render(<WaitlistScreen onActivated={onActivated} />)

    expect(screen.getByText('Вы в списке ожидания')).toBeDefined()
    expect(screen.getByText('Telegram-канал ↗')).toBeDefined()

    const input = screen.getByPlaceholderText('Например, BETA2026')
    const button = screen.getByRole('button', { name: 'Активировать' })

    fireEvent.change(input, { target: { value: 'BETA2026' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(redeemInvite).toHaveBeenCalledWith('BETA2026')
      expect(onActivated).toHaveBeenCalled()
    })
  })

  it('displays error message on invalid code', async () => {
    const redeemInvite = vi.fn().mockRejectedValue(new Error('Приглашение не найдено'))

    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      redeemInvite,
      logout: vi.fn(),
    })

    render(<WaitlistScreen />)

    const input = screen.getByPlaceholderText('Например, BETA2026')
    const button = screen.getByRole('button', { name: 'Активировать' })

    fireEvent.change(input, { target: { value: 'WRONG' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Приглашение не найдено')).toBeDefined()
    })
  })
})
