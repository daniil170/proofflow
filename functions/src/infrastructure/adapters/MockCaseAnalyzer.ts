import { CaseDraft } from '../../domain/types.js'
import { CaseAnalyzer } from '../ports/CaseAnalyzer.js'

export const FIXTURE_CASE_DRAFT: CaseDraft = {
  headline: {
    text: '8 сделок за сутки',
    evidenceId: null,
  },
  metric: {
    value: '8',
    label: 'сделок за сутки вместо обычных 2',
    evidenceId: null,
  },
  summaryRows: [
    {
      label: 'Результат',
      text: 'Вчера за сутки закрыли 8 сделок вместо обычных двух, клиенты довольны.',
      origin: 'ai_paraphrase',
      evidenceId: null,
    },
  ],
  problem: '',
  solution: '',
  result: 'Вчера за сутки закрыли 8 сделок вместо обычных двух, клиенты довольны.',
  quote: {
    text: 'Спасибо огромное, теперь масштабируем на весь отдел продаж.',
    authorLabel: 'Алексей Морозов',
    authorRole: 'CEO',
    authorCompany: 'Nordic Tech',
    evidenceId: null,
  },
  tags: ['Автоматизация', 'B2B', 'Продажи'],
  missingFields: [],
  needsReview: [],
}

export class MockCaseAnalyzer implements CaseAnalyzer {
  private customDraft?: CaseDraft

  constructor(customDraft?: CaseDraft) {
    this.customDraft = customDraft
  }

  async analyze(): Promise<CaseDraft> {
    if (this.customDraft) {
      return this.customDraft
    }

    return {
      ...FIXTURE_CASE_DRAFT,
    }
  }
}
