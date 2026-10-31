import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCaseStyle } from '../useCaseStyle'

describe('useCaseStyle hook', () => {
  const createMockRepo = () => ({
    update: vi.fn().mockResolvedValue(undefined),
  })

  it('populates previewData from real caseItem draft without dummy fallback strings', () => {
    const mockCase = {
      id: 'case-1',
      selectedVariant: 'whatsapp',
      messenger: 'telegram',
      branding: {
        accentColor: '#ffd13b',
        showLogo: true,
        companyName: 'Тестовая школа',
      },
      draft: {
        headline: { text: 'Было очень круто, и всё понятно!' },
        summaryRows: [
          { label: 'Задача', text: 'Сложная тема, интенсивное обучение с нуля' },
          { label: 'Результат', text: 'Всё понятно, занятие прошло круто' },
        ],
        quote: {
          text: 'Было очень круто! Спасибо большое за занятие 🥰',
          authorLabel: 'Елена К.',
          authorRole: 'Студент курса',
        },
        tags: ['Обучение', 'Telegram'],
      },
      selectedChatMessages: [
        { text: 'но делаются успехи', side: 'client', time: '19:30' },
      ],
    }

    const { result } = renderHook(() =>
      useCaseStyle({ caseItem: mockCase, repository: createMockRepo() })
    )

    expect(result.current.selectedVariant).toBe('whatsapp')
    expect(result.current.previewData.headline).toBe('Было очень круто, и всё понятно!')
    expect(result.current.previewData.summaryRows).toHaveLength(2)
    expect(result.current.previewData.cardMessages).toHaveLength(1)
    expect(result.current.previewData.messenger).toBe('telegram')
    expect(result.current.previewData.author).toBe('Елена К.')
    expect(result.current.previewData.before).not.toContain('Клиент терял лиды')
    expect(result.current.previewData.done).not.toContain('Полностью переработали интерфейс')
  })

  it('syncs selectedVariant and branding when caseItem loads asynchronously', () => {
    const repo = createMockRepo()
    const { result, rerender } = renderHook(
      ({ item }) => useCaseStyle({ caseItem: item, repository: repo }),
      { initialProps: { item: null } }
    )

    expect(result.current.selectedVariant).toBe('dark')

    const loadedCase = {
      id: 'case-async-1',
      selectedVariant: 'whatsapp',
      branding: {
        accentColor: '#25d366',
        showLogo: false,
        companyName: 'Новая компания',
      },
      draft: {
        headline: { text: 'Реальный прогресс' },
      },
    }

    rerender({ item: loadedCase })

    expect(result.current.selectedVariant).toBe('whatsapp')
    expect(result.current.accentColor).toBe('#25d366')
    expect(result.current.showLogo).toBe(false)
    expect(result.current.companyName).toBe('Новая компания')
    expect(result.current.previewData.headline).toBe('Реальный прогресс')
  })

  it('updates repository on saveStyle', async () => {
    const repo = createMockRepo()
    const onSave = vi.fn()
    const mockCase = {
      id: 'case-save-1',
      selectedVariant: 'dark',
    }

    const { result } = renderHook(() =>
      useCaseStyle({ caseItem: mockCase, repository: repo, onSave })
    )

    act(() => {
      result.current.handleSelectVariant('whatsapp')
      result.current.handleAccentChange('#3b82f6')
    })

    await act(async () => {
      await result.current.saveStyle()
    })

    expect(repo.update).toHaveBeenCalledWith('case-save-1', {
      selectedVariant: 'whatsapp',
      branding: expect.objectContaining({
        accentColor: '#3b82f6',
      }),
    })
    expect(onSave).toHaveBeenCalled()
  })
})
