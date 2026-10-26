import { ChatExtraction } from '../../domain/types.js'
import { ChatReader } from '../../infrastructure/ports/ChatReader.js'
import { NormalizedSourceResult } from './normalizeSources.js'

export interface ReadScreenshotsInput {
  screenshots: NormalizedSourceResult[]
  chatReader: ChatReader
}

export const readScreenshots = async ({
  screenshots,
  chatReader,
}: ReadScreenshotsInput): Promise<ChatExtraction[]> => {
  const extractions: ChatExtraction[] = []

  for (const item of screenshots) {
    const extraction = await chatReader.readScreenshot(
      item.localFilePath,
      item.source.id,
      item.source.order
    )
    extractions.push(extraction)
  }

  extractions.sort((a, b) => a.order - b.order)
  return extractions
}
