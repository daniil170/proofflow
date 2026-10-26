export interface StoragePort {
  downloadFile(storagePath: string, localDestination: string): Promise<string>
  readFileBuffer(filePath: string): Promise<Buffer>
}
