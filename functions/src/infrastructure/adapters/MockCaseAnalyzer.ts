import { CaseDraft } from '../../domain/types.js'
import { AnalysisInput, CaseAnalyzer } from '../ports/CaseAnalyzer.js'

export const FIXTURE_CASE_DRAFT: CaseDraft = {
  metric: {
    value: '+140%',
    label: 'рост конверсии воронки',
    evidenceId: null,
  },
  problem:
    'Было: Команда тратила по четыре часа в день на ручной сбор и проверку клиентских анкет, из-за чего клиенты остывали.',
  solution:
    'Сделано: Настроили автоматический парсинг созвонов и экспресс-валидацию ключевых данных.',
  result:
    'Стало: Скорость обработки заявок увеличилась в 3 раза, конверсия воронки выросла на 140%.',
  quote: {
    text: 'Сервис окупился в первый же месяц использования, команда освободила более двадцати часов в неделю.',
    authorLabel: 'Анна К.',
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

  async analyze(input: AnalysisInput): Promise<CaseDraft> {
    if (this.customDraft) {
      return this.customDraft
    }

    const clientLabel = input.clientLabel || 'Клиент'

    return {
      ...FIXTURE_CASE_DRAFT,
      quote: {
        ...FIXTURE_CASE_DRAFT.quote,
        authorCompany: clientLabel,
      },
    }
  }
}
