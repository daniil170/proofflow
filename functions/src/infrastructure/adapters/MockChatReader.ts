import { ChatExtraction } from '../../domain/types.js'
import { ChatReader } from '../ports/ChatReader.js'

export const FIXTURE_CHAT_EXTRACTION: ChatExtraction = {
  screenshotSourceId: 'fixture-scr-1',
  messenger: 'telegram',
  confidence: 0.96,
  order: 0,
  messages: [
    {
      id: 'msg-1',
      side: 'client',
      text: 'Привет! Хотел сказать, что мы протестировали новую связку.',
      time: '14:22',
      order: 0,
    },
    {
      id: 'msg-2',
      side: 'client',
      text: 'Вчера за сутки закрыли 8 сделок вместо обычных двух, клиенты довольны.',
      time: '14:23',
      order: 1,
    },
    {
      id: 'msg-3',
      side: 'me',
      text: 'Отличный результат! Рады помочь вашей команде.',
      time: '14:25',
      order: 2,
    },
    {
      id: 'msg-4',
      side: 'client',
      text: 'Спасибо огромное, теперь масштабируем на весь отдел продаж.',
      time: '14:28',
      order: 3,
    },
  ],
}

export class MockChatReader implements ChatReader {
  private customExtraction?: ChatExtraction

  constructor(customExtraction?: ChatExtraction) {
    this.customExtraction = customExtraction
  }

  async readScreenshot(
    imageFilePath: string,
    screenshotSourceId: string,
    order = 0
  ): Promise<ChatExtraction> {
    if (this.customExtraction) {
      return {
        ...this.customExtraction,
        screenshotSourceId,
        order,
      }
    }

    return {
      ...FIXTURE_CHAT_EXTRACTION,
      screenshotSourceId,
      order,
    }
  }
}
