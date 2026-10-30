import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CaseCard } from '../CaseCard'

describe('CaseCard demo fallback elimination', () => {
  const styles = ['dark', 'newspaper', 'whatsapp', 'receipt', 'minimal']
  const forbiddenDemoPatterns = [
    /кондитерск/i,
    /Это было невероятно вкусно/i,
    /Описание проблемы/i,
    /Реализованное решение/i,
    /Подтвержденный результат/i,
    /Кейс для/i,
    /Анна К\./i,
    /SMM/i,
    /онлайн-школа/i,
    /Стабильный поток заявок/i,
  ]

  styles.forEach((variant) => {
    it(`renders ${variant} with minimal data with zero demo strings leaking`, () => {
      const minimalData = {
        quote: 'Было очень круто, и всё понятно! Спасибо большое за занятие',
        author: 'Клиент',
      }

      const { container } = render(<CaseCard variant={variant} data={minimalData} />)
      const renderedText = container.textContent || ''

      forbiddenDemoPatterns.forEach((pattern) => {
        expect(renderedText).not.toMatch(pattern)
      })

      if (variant !== 'whatsapp') {
        expect(renderedText).not.toMatch(/whatsapp/i)
      } else {
        expect(renderedText).not.toMatch(/whatsapp/i)
      }
    })

    it(`renders ${variant} with real Telegram feedback without WhatsApp or demo fallback`, () => {
      const realTelegramData = {
        headline: 'Реально мозги кипят',
        quote: 'Было очень круто, и всё понятно! Спасибо большое за занятие',
        author: 'Клиент',
        messenger: 'telegram',
        summaryRows: [
          { id: '1', label: 'Задача', text: 'Сложная тема, интенсивное обучение', origin: 'client_words' },
          { id: '2', label: 'Результат', text: 'Всё понятно, занятие прошло круто', origin: 'client_words' },
        ],
        cardMessages: [
          { side: 'client', text: 'До субботы, всё было хорошо 😊 реально мозги кипят', time: '19:30' },
          { side: 'client', text: 'Было очень круто, и всё понятно! Спасибо большое 🥰', time: '19:31' },
        ],
      }

      const { container } = render(<CaseCard variant={variant} data={realTelegramData} />)
      const renderedText = container.textContent || ''

      forbiddenDemoPatterns.forEach((pattern) => {
        expect(renderedText).not.toMatch(pattern)
      })

      expect(renderedText).not.toMatch(/whatsapp/i)
      if (variant === 'whatsapp') {
        expect(renderedText).toMatch(/telegram/i)
      }
    })
  })
})