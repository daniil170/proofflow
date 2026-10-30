import { CaseDraft } from '../../domain/types.js'
import { CaseAnalyzer } from '../ports/CaseAnalyzer.js'

export const FIXTURE_CASE_DRAFT: CaseDraft = {
  headline: {
    text: '+140% рост конверсии воронки',
    evidenceId: null,
  },
  metric: {
    value: '+140%',
    label: 'рост конверсии воронки',
    evidenceId: null,
  },
  summaryRows: [
    {
      label: 'Задача',
      text: 'Команда тратила по четыре часа в день на ручной сбор и проверку клиентских анкет',
      origin: 'ai_paraphrase',
      evidenceId: null,
    },
    {
      label: 'Сделано',
      text: 'Настроили автоматический парсинг созвонов и экспресс-валидацию ключевых данных',
      origin: 'ai_paraphrase',
      evidenceId: null,
    },
    {
      label: 'Результат',
      text: 'Скорость обработки заявок увеличилась в 3 раза, конверсия воронки выросла на 140%',
      origin: 'ai_paraphrase',
      evidenceId: null,
    },
  ],
  problem:
    'Было: Команда тратила по четыре часа в день на ручной сбор и проверку клиентских анкет, из-за чего клиенты остывали.',
  solution:
    'Сделано: Настроили автоматический парсинг созвонов и экспресс-валидацию ключевых данных.',
  result:
    'Стало: Скорость обработки заявок увеличилась в 3 раза, конверсия воронки выросла на 140%.',
  quote: {
    text: 'Сервис окупился в первый же месяц использования, команда освободила более двадцати часов в неделю.',
    authorLabel: 'Клиент',
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
