import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../ProtectedRoute.jsx'
import * as useAuthModule from '../../model/useAuth.js'

vi.mock('../../model/useAuth.js', () => ({
  useAuth: vi.fn(),
}))

describe('ProtectedRoute', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders loading indicator when isLoading is true', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      accessStatus: 'waitlist',
      isOnboarded: false,
      isAdmin: false,
    })

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByRole('status')).toBeDefined()
    expect(screen.queryByText('Secret Content')).toBeNull()
  })

  it('redirects to /login when unauthenticated', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      accessStatus: 'waitlist',
      isOnboarded: false,
      isAdmin: false,
    })

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Screen')).toBeDefined()
    expect(screen.queryByText('Secret Content')).toBeNull()
  })

  it('shows NotFoundPage when unauthenticated user visits /admin', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      accessStatus: 'waitlist',
      isOnboarded: false,
      isAdmin: false,
    })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Страница не найдена')).toBeDefined()
    expect(screen.queryByText('Admin Content')).toBeNull()
  })

  it('shows NotFoundPage when authenticated non-admin visits /admin', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      accessStatus: 'active',
      isOnboarded: true,
      isAdmin: false,
    })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Страница не найдена')).toBeDefined()
    expect(screen.queryByText('Admin Content')).toBeNull()
  })

  it('renders admin content when user has isAdmin=true on /admin', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      accessStatus: 'active',
      isOnboarded: false,
      isAdmin: true,
    })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Admin Content')).toBeDefined()
  })

  it('shows WaitlistScreen when user has waitlist status', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      accessStatus: 'waitlist',
      isOnboarded: false,
      isAdmin: false,
      logout: vi.fn(),
      redeemInvite: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Вы в списке ожидания')).toBeDefined()
    expect(screen.getByText('У меня есть инвайт-код')).toBeDefined()
    expect(screen.queryByText('Secret Content')).toBeNull()
  })

  it('shows BlockedScreen when user is blocked', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      accessStatus: 'blocked',
      isOnboarded: false,
      isAdmin: false,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Доступ к платформе ограничен')).toBeDefined()
    expect(screen.queryByText('Secret Content')).toBeNull()
  })

  it('redirects to /app/welcome when active but not onboarded', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      accessStatus: 'active',
      isOnboarded: false,
      isAdmin: false,
    })

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Cases List</div>
              </ProtectedRoute>
            }
          />
          <Route path="/app/welcome" element={<div>Welcome Onboarding Screen</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Welcome Onboarding Screen')).toBeDefined()
    expect(screen.queryByText('Cases List')).toBeNull()
  })

  it('renders children when active and onboarded', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      accessStatus: 'active',
      isOnboarded: true,
      isAdmin: false,
    })

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Cases List Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Cases List Content')).toBeDefined()
  })
})
