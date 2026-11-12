import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../AuthContext.jsx'
import { useAuth } from '../useAuth.js'

describe('AuthProvider onboarding contract', () => {
  it('exposes profile and consent actions and marks a completed profile as onboarded', async () => {
    const gateway = {
      subscribeToAuthState: vi.fn((callback) => {
        callback({ id: 'user-1', email: 'pilot@example.com' })
        return () => {}
      }),
      signInWithGoogle: vi.fn(),
      sendEmailLink: vi.fn(),
      signInWithEmailLink: vi.fn(),
      signOut: vi.fn(),
      isEmailLink: vi.fn(() => false),
      getStoredEmailForSignIn: vi.fn(() => ''),
      syncAdminClaims: vi.fn(async () => false),
    }
    const userRepository = {
      subscribeToUser: vi.fn((_uid, callback) => {
        callback({ id: 'user-1', accessStatus: 'active', workspaceId: 'user-1' })
        return () => {}
      }),
      redeemInvite: vi.fn(),
      updateProfile: vi.fn(async (_uid, profile) => profile),
      acceptConsent: vi.fn(async (_uid, consent) => consent),
    }
    let auth

    const Consumer = () => {
      auth = useAuth()
      return null
    }

    render(
      <AuthProvider gateway={gateway} userRepository={userRepository}>
        <Consumer />
      </AuthProvider>
    )

    await waitFor(() => expect(typeof auth.updateProfile).toBe('function'))

    await act(async () => {
      await auth.updateProfile({ displayName: 'Даниил', companyName: 'ProofFlow' })
      await auth.acceptConsent({ documentVersion: 'test', acceptedAt: 1 })
    })

    expect(userRepository.updateProfile).toHaveBeenCalledWith('user-1', {
      displayName: 'Даниил',
      companyName: 'ProofFlow',
    })
    expect(userRepository.acceptConsent).toHaveBeenCalledWith('user-1', {
      documentVersion: 'test',
      acceptedAt: 1,
    })
    expect(auth.isOnboarded).toBe(true)
  })
})
