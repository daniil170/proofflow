import { ChatExtraction } from '../../domain/types.js'

export interface ChatReader {
  readScreenshot(
    imageFilePath: string,
    screenshotSourceId: string,
    order?: number
  ): Promise<ChatExtraction>
}
