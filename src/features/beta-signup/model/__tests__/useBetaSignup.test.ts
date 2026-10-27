import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBetaSignup } from '../useBetaSignup.js'

describe('useBetaSignup hook', () => {
  const createMockGateway = () => ({
    submit: vi.fn().mockResolvedValue({ success: true, id: 'test-signup-1' }),
  })

  it('has correct initial state', () => {
    const { result } = renderHook(() => useBetaSignup(createMockGateway()))

    expect(result.current.formData.email).toBe('')
    expect(result.current.formData.telegramUsername).toBe('')
    expect(result.current.formData.businessType).toBe('agency_or_studio')
    expect(result.current.formData.consent).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })

  it('updates form fields and clears contact errors', () => {
    const { result } = renderHook(() => useBetaSignup(createMockGateway()))

    act(() => {
      result.current.updateField('telegramUsername', '@lead_user')
    })
    expect(result.current.formData.telegramUsername).toBe('@lead_user')

    act(() => {
      result.current.updateField('email', 'lead@studio.ru')
    })
    expect(result.current.formData.email).toBe('lead@studio.ru')
  })

  it('blocks submission without any contact and sets error', async () => {
    const gateway = createMockGateway()
    const { result } = renderHook(() => useBetaSignup(gateway))

    act(() => {
      result.current.updateField('consent', true)
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(gateway.submit).not.toHaveBeenCalled()
    expect(result.current.errors.email).toContain('Укажите хотя бы один способ связи')
    expect(result.current.isSuccess).toBe(false)
  })

  it('submits successfully with email only', async () => {
    const gateway = createMockGateway()
    const { result } = renderHook(() => useBetaSignup(gateway))

    act(() => {
      result.current.updateField('email', 'founder@agency.io')
      result.current.updateField('consent', true)
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(gateway.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'founder@agency.io',
        telegramUsername: null,
        consent: true,
        source: 'web',
      })
    )
    expect(result.current.isSuccess).toBe(true)
  })

  it('submits successfully with telegram only, normalizing link', async () => {
    const gateway = createMockGateway()
    const { result } = renderHook(() => useBetaSignup(gateway))

    act(() => {
      result.current.updateField('telegramUsername', 'https://t.me/lead_marketer')
      result.current.updateField('consent', true)
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(gateway.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        email: null,
        telegramUsername: 'lead_marketer',
        consent: true,
        source: 'web',
      })
    )
    expect(result.current.isSuccess).toBe(true)
  })

  it('silently succeeds without calling gateway when honeypot is filled', async () => {
    const gateway = createMockGateway()
    const { result } = renderHook(() => useBetaSignup(gateway))

    act(() => {
      result.current.updateField('email', 'bot@spam.com')
      result.current.updateField('consent', true)
      result.current.updateField('websiteHoneypot', 'http://spam.org')
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(gateway.submit).not.toHaveBeenCalled()
    expect(result.current.isSuccess).toBe(true)
  })

  it('handles gateway failure with error status and message', async () => {
    const failingGateway = {
      submit: vi.fn().mockRejectedValue(new Error('Network offline')),
    }
    const { result } = renderHook(() => useBetaSignup(failingGateway))

    act(() => {
      result.current.updateField('email', 'lead@test.ru')
      result.current.updateField('consent', true)
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(result.current.isSuccess).toBe(false)
    expect(result.current.serverError).toContain('Не удалось отправить заявку')
  })

  it('resets form state when reset is called', () => {
    const { result } = renderHook(() => useBetaSignup(createMockGateway()))

    act(() => {
      result.current.updateField('email', 'temp@test.ru')
      result.current.updateField('telegramUsername', '@temp')
      result.current.updateField('consent', true)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.formData.email).toBe('')
    expect(result.current.formData.telegramUsername).toBe('')
    expect(result.current.formData.consent).toBe(false)
    expect(result.current.errors).toEqual({})
  })
})
