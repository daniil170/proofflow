import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useClientConsent } from '../useClientConsent'

describe('useClientConsent', () => {
  it('creates consent link and invokes callback', async () => {
    const mockGateway = {
      createConsentRequest: vi.fn(async () => ({
        token: 'token-123',
        url: 'https://proofflow.ru/consent/token-123',
      })),
      getConsentByToken: vi.fn(),
      submitClientConsent: vi.fn(),
    }
    const mockRepo = {
      update: vi.fn(),
    }
    const onConsentUpdated = vi.fn()

    const { result } = renderHook(() =>
      useClientConsent({
        caseItem: { id: 'case-1' },
        gateway: mockGateway,
        repository: mockRepo,
        onConsentUpdated,
      })
    )

    await act(async () => {
      await result.current.createConsentLink()
    })

    expect(mockGateway.createConsentRequest).toHaveBeenCalledWith('case-1')
    expect(result.current.consentUrl).toBe('https://proofflow.ru/consent/token-123')
    expect(onConsentUpdated).toHaveBeenCalledWith({ clientConsentStatus: 'pending' })
  })

  it('confirms direct consent and updates repository', async () => {
    const mockGateway = {
      createConsentRequest: vi.fn(),
      getConsentByToken: vi.fn(),
      submitClientConsent: vi.fn(),
    }
    const mockRepo = {
      update: vi.fn(async () => {}),
    }
    const onConsentUpdated = vi.fn()

    const { result } = renderHook(() =>
      useClientConsent({
        caseItem: { id: 'case-2' },
        gateway: mockGateway,
        repository: mockRepo,
        onConsentUpdated,
      })
    )

    await act(async () => {
      await result.current.confirmDirectConsent()
    })

    expect(mockRepo.update).toHaveBeenCalledWith('case-2', {
      consentConfirmed: true,
      clientConsentStatus: 'approved',
    })
    expect(onConsentUpdated).toHaveBeenCalledWith({
      consentConfirmed: true,
      clientConsentStatus: 'approved',
    })
  })
})
