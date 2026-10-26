import { promises as fs } from 'fs'
import { getStorage } from 'firebase-admin/storage'
import { StoragePort } from '../ports/StoragePort.js'

export class FirebaseStorageAdapter implements StoragePort {
  private bucketName?: string

  constructor(bucketName?: string) {
    this.bucketName = bucketName || process.env.STORAGE_BUCKET
  }

  private getBucket() {
    return this.bucketName ? getStorage().bucket(this.bucketName) : getStorage().bucket()
  }

  async downloadFile(
    storagePath: string,
    localDestination: string
  ): Promise<string> {
    const file = this.getBucket().file(storagePath)
    await file.download({ destination: localDestination })
    return localDestination
  }

  async readFileBuffer(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath)
  }
}
