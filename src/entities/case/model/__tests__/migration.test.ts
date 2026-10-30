import { describe, it, expect } from 'vitest'
import { migrateCase, migrateCaseDraft } from '../migration.js'

describe('Case schema backward compatibility migration', () => {
  it('reads legacy case without throwing and sets headline to empty', () => {
    const legacyCase = {
      id: 'legacy-case-1',
      ownerId: 'user-1',
      status: 'ready',
      clientLabel: 'ООО Вектор',
      draft: {
        problem: 'Было: заявки терялись в ручной переписке',
        solution: 'Сделано: настроили интеграцию с CRM',
        result: 'Стало: конверсия выросла в 2 раза',
        quote: {
          text: 'Очень довольны внедрением!',
          authorLabel: 'Анна К.',
        },
        tags: ['crm'],
        missingFields: [],
        needsReview: [],
      },
    }

    const migrated = migrateCase(legacyCase)
    expect(migrated).toBeDefined()
    expect(migrated?.draft?.headline).toEqual({ text: '', evidenceId: null })
    expect(migrated?.draft?.quote?.authorLabel).toBe('Клиент')
    expect(migrated?.messenger).toBe('unknown')
  })

  it('marks summaryRows as client_words only when verbatim in source, otherwise ai_paraphrase with needsReview', () => {
    const legacyDraft = {
      problem: 'Было: заявки терялись в ручной переписке',
      solution: 'Сделано: настроили интеграцию с CRM',
      result: 'Стало: конверсия выросла в 2 раза',
      quote: {
        text: 'Очень довольны внедрением!',
      },
      tags: [],
      missingFields: [],
      needsReview: [],
    }

    const sourcesWithExactProblemOnly = 'Привет! Да, у нас заявки терялись в ручной переписке постоянно. Но теперь всё летает.'

    const migrated = migrateCaseDraft(legacyDraft, sourcesWithExactProblemOnly)
    expect(migrated).toBeDefined()

    const rows = migrated!.summaryRows
    expect(rows).toHaveLength(3)

    const problemRow = rows.find((r) => r.id === 'legacy-problem')
    expect(problemRow?.origin).toBe('client_words')
    expect(problemRow?.needsReview).toBe(false)

    const solutionRow = rows.find((r) => r.id === 'legacy-solution')
    expect(solutionRow?.origin).toBe('ai_paraphrase')
    expect(solutionRow?.needsReview).toBe(true)

    const resultRow = rows.find((r) => r.id === 'legacy-result')
    expect(resultRow?.origin).toBe('ai_paraphrase')
    expect(resultRow?.needsReview).toBe(true)
  })
})