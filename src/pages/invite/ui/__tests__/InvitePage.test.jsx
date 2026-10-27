import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InvitePage } from '../InvitePage.jsx'
import * as sharedApi from '@/shared/api'
import * as useAuthModule from '@/features/auth/model/useAuth.js'

describe('InvitePage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders valid invite and allows authenticated user to redeem', async () => {
    const mockRepo = {
      checkInvite: vi.fn().mockResolvedValue({
        valid: true,
        status: 'issued',
        expiresAt: Date.now() + 86400000,
      }),
    }
    vi.spyOn(sharedApi, 'getUserRepository').mockReturnValue(mockRepo)

    const redeemInvite = vi.fn().mockResolvedValue({ success: true, accessStatus: 'active' })
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      redeemInvite,
    })

    render(
      <MemoryRouter initialEntries={['/invite/VIP2026']}>
        <Routes>
          <Route path="/invite/:code" element={<InvitePage />} />
          <Route path="/app/welcome" element={<div>Welcome Destination</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('VIP2026')).toBeDefined()
      expect(screen.getByText('Добро пожаловать в бета-тест')).toBeDefined()
    })

    const activateBtn = screen.getByRole('button', { name: 'Активировать и продолжить' })
    fireEvent.click(activateBtn)

    await waitFor(() => {
      expect(redeemInvite).toHaveBeenCalledWith('VIP2026')
      expect(screen.getByText('Welcome Destination')).toBeDefined()
    })
  })

  it('renders expired invite error', async () => {
    const mockRepo = {
      checkInvite: vi.fn().mockResolvedValue({
        valid: false,
        status: 'expired',
      }),
    }
    vi.spyOn(sharedApi, 'getUserRepository').mockReturnValue(mockRepo)
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
    })

    render(
      <MemoryRouter initialEntries={['/invite/OLD_CODE']}>
        <Routes>
          <Route path="/invite/:code" element={<InvitePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Срок действия этого приглашения истёк. Запросите новый инвайт или оставьте заявку на главной.')).toBeDefined()
      expect(screen.getByText('На главную страницу')).toBeDefined()
    })
  })
})
