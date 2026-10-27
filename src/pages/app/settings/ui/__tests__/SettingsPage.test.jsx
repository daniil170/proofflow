import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SettingsPage } from '../SettingsPage.jsx'

afterEach(() => {
  cleanup()
})

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'test@example.com' },
    userRecord: {
      profile: { displayName: 'Тестовый Пользователь', companyName: 'Студия' },
      accessStatus: 'active',
      telegramUserId: null,
    },
    logout: vi.fn(),
    createTelegramLinkToken: vi.fn(),
  }),
}))

vi.mock('@/shared/api', () => {
  const cases = [
    { id: 'c1', title: 'Кейс 1', client: 'Клиент 1', status: 'ready', sources: [] },
  ]
  return {
    getCaseRepository: () => ({
      subscribeByOwner: (_ownerId, cb) => {
        cb(cases)
        return () => {}
      },
      delete: vi.fn().mockResolvedValue({ success: true }),
      listByOwner: vi.fn().mockResolvedValue(cases),
    }),
    getUserRepository: () => ({
      deleteAccount: vi.fn().mockResolvedValue({ success: true }),
    }),
    exportUserData: vi.fn().mockResolvedValue({}),
  }
})

describe('SettingsPage', () => {
  it('renders user profile, case management and export button', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Тестовый Пользователь')).toBeDefined()
    expect(screen.getByText('Экспорт своих данных в JSON')).toBeDefined()
    expect(screen.getByText('Кейс 1')).toBeDefined()
  })

  it('opens confirmation modal on case delete click', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )

    const deleteBtn = screen.getAllByRole('button', { name: 'Удалить' })[0]
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(screen.getByText('Да, удалить')).toBeDefined()
    })
  })

  it('opens confirmation modal for account delete and checks input', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )

    const deleteAccBtn = screen.getByRole('button', { name: 'Удалить аккаунт и все данные' })
    fireEvent.click(deleteAccBtn)

    await waitFor(() => {
      expect(screen.getByText('Удалить аккаунт навсегда')).toBeDefined()
    })

    const confirmBtn = screen.getByRole('button', { name: 'Удалить аккаунт навсегда' })
    expect(confirmBtn.hasAttribute('disabled')).toBe(true)

    const input = screen.getByPlaceholderText('УДАЛИТЬ')
    fireEvent.change(input, { target: { value: 'УДАЛИТЬ' } })

    expect(confirmBtn.hasAttribute('disabled')).toBe(false)
  })
})
