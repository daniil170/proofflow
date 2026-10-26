import { Transcript } from '../../domain/types.js'
import { TranscribeOptions, Transcriber } from '../ports/Transcriber.js'

export const FIXTURE_TRANSCRIPT: Transcript = {
  segments: [
    {
      id: 'seg-1',
      start: 0,
      end: 6.2,
      text: 'Добрый день! Хотим подвести итоги первого месяца внедрения вашей системы.',
    },
    {
      id: 'seg-2',
      start: 6.5,
      end: 14.8,
      text: 'До запуска мы тратили по четыре часа в день на ручной сбор и проверку клиентских анкет.',
    },
    {
      id: 'seg-3',
      start: 15.2,
      end: 22.0,
      text: 'После того как настроили автоматический парсинг созвонов, процесс полностью изменился.',
    },
    {
      id: 'seg-4',
      start: 22.4,
      end: 31.5,
      text: 'Конверсия воронки выросла на 140% уже на второй неделе запуска, а скорость обработки заявок увеличилась в 3 раза.',
    },
    {
      id: 'seg-5',
      start: 32.0,
      end: 40.2,
      text: 'Сервис окупился в первый же месяц использования, команда освободила более двадцати часов в неделю.',
    },
  ],
}

export class MockTranscriber implements Transcriber {
  private customTranscript?: Transcript

  constructor(customTranscript?: Transcript) {
    this.customTranscript = customTranscript
  }

  async transcribe(
    audioFilePath: string,
    options?: TranscribeOptions
  ): Promise<Transcript> {
    if (this.customTranscript) {
      return this.customTranscript
    }

    return {
      sourceId: audioFilePath,
      segments: FIXTURE_TRANSCRIPT.segments.map((seg) => ({
        ...seg,
        text: options?.language === 'en' ? 'Conversion grew by 140%.' : seg.text,
      })),
    }
  }
}
