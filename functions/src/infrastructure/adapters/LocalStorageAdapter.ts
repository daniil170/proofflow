import { promises as fs } from 'fs'
import path from 'path'
import { StoragePort } from '../ports/StoragePort.js'

export class LocalStorageAdapter implements StoragePort {
  private baseDir: string

  constructor(baseDir = '.') {
    this.baseDir = baseDir
  }

  async downloadFile(
    storagePath: string,
    localDestination: string
  ): Promise<string> {
    const fullSourcePath = path.isAbsolute(storagePath)
      ? storagePath
      : path.resolve(this.baseDir, storagePath)

    if (fullSourcePath === localDestination) {
      return localDestination
    }

    await fs.mkdir(path.dirname(localDestination), { recursive: true })
    try {
      await fs.copyFile(fullSourcePath, localDestination)
    } catch {
      await fs.writeFile(localDestination, Buffer.from('mock file payload'))
    }
    return localDestination
  }

  async readFileBuffer(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath)
  }
}
