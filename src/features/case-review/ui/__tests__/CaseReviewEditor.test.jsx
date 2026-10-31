import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CaseReviewEditor } from '../CaseReviewEditor.jsx'

describe('CaseReviewEditor', () => {
  it('renders headline, summary rows and preview card from reviewState', () => {
    const mockReviewState = {
      draft: {
        headline: { text: 'Было очень круто, и всё понятно!', evidenceId: 'ev-1' },
        metric: { value: '', label: '', evidenceId: null },
        problem: '',
        solution: '',
        result: 'Делаются успехи.',
        summaryRows: [
          { id: 'row-1', label: 'Впечатление', text: 'Мозги кипят, но мне понравилось.', origin: 'ai_paraphrase' },
          { id: 'row-2', label: 'Результат', text: 'Делаются успехи.', origin: 'ai_paraphrase' },
        ],
        quote: { text: 'Было очень круто! Спасибо большое за занятие 🥰', authorLabel: 'Клиент', evidenceId: 'ev-2' },
        tags: ['Обучение'],
        missingFields: [],
        needsReview: [],
      },
      selectedVariant: 'dark',
      handleSelectVariant: () => {},
      modifiedFields: [],
      saveStatus: 'saved',
      validationErrors: {},
      canMarkVerified: true,
      isRegenerating: false,
      activeEvidence: null,
      feedbackState: { rating: null, comment: '', isSubmitting: false, isSubmitted: false },
      activeTab: 'edit',
      cardPreviewData: {
        headline: 'Было очень круто, и всё понятно!',
        metric: '',
        metricLabel: '',
        before: '',
        done: '',
        after: 'Делаются успехи.',
        summaryRows: [
          { id: 'row-1', label: 'Впечатление', text: 'Мозги кипят, но мне понравилось.', origin: 'ai_paraphrase' },
          { id: 'row-2', label: 'Результат', text: 'Делаются успехи.', origin: 'ai_paraphrase' },
        ],
        quote: 'Было очень круто! Спасибо большое за занятие 🥰',
        author: 'Клиент',
        authorRole: '',
        authorCompany: '',
        company: '',
        isVerifiedByChat: true,
        title: 'Было очень круто, и всё понятно!',
        category: 'Обучение',
        niche: '',
        messenger: 'telegram',
        cardMessages: [
          { id: 'msg-1', side: 'client', text: 'реально мозги кипят', time: '19:30' },
        ],
        chatMessages: [
          { id: 'msg-1', side: 'client', text: 'реально мозги кипят', time: '19:30' },
        ],
      },
      sourcesDeletedAt: null,
      storageRetentionDays: 14,
      messenger: 'telegram',
      selectedChatMessages: [
        { id: 'msg-1', side: 'client', text: 'реально мозги кипят', time: '19:30' },
      ],
      allChatMessages: [
        { id: 'msg-1', side: 'client', text: 'реально мозги кипят', time: '19:30' },
        { id: 'msg-2', side: 'client', text: 'Было очень круто!', time: '19:31' },
      ],
      setActiveTab: () => {},
      updateField: () => {},
      updateSummaryRow: () => {},
      confirmSummaryRow: () => {},
      addSummaryRow: () => {},
      removeSummaryRow: () => {},
      toggleChatMessage: () => {},
      handleSetMessenger: () => {},
      isFieldModified: () => false,
      isFieldNeedsReview: () => false,
      isRowNeedsReview: () => false,
      openEvidence: () => {},
      closeEvidence: () => {},
      markAsVerified: () => {},
      regenerateDraft: () => {},
      submitFeedback: () => {},
    }

    render(<CaseReviewEditor reviewState={mockReviewState} />)

    const headlineInput = screen.getByDisplayValue('Было очень круто, и всё понятно!')
    expect(headlineInput).toBeDefined()

    expect(screen.getByDisplayValue('Мозги кипят, но мне понравилось.')).toBeDefined()
    expect(screen.getByDisplayValue('Делаются успехи.')).toBeDefined()
    expect(screen.getByText(/выбрано: 1 из 3/)).toBeDefined()
  })
})
