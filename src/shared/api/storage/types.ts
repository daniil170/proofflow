export interface UploadResult {
  readonly storagePath: string
  readonly downloadUrl?: string
}

export interface UploadTaskControl {
  readonly promise: Promise<UploadResult>
  readonly cancel: () => void
}

export interface SourceUploader {
  upload(
    file: File | Blob,
    path: string,
    onProgress?: (progress: number) => void
  ): UploadTaskControl
}
