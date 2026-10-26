export const mockSourceUploader = Object.freeze({
  upload(file, path, onProgress) {
    let isCancelled = false
    let timerId = null

    const promise = new Promise((resolve, reject) => {
      let step = 0
      timerId = setInterval(() => {
        if (isCancelled) {
          clearInterval(timerId)
          reject(new Error('UPLOAD_CANCELLED'))
          return
        }
        step += 25
        if (onProgress) {
          onProgress(Math.min(step, 100))
        }
        if (step >= 100) {
          clearInterval(timerId)
          let downloadUrl = ''
          if (
            typeof URL !== 'undefined' &&
            typeof URL.createObjectURL === 'function' &&
            file instanceof Blob
          ) {
            try {
              downloadUrl = URL.createObjectURL(file)
            } catch {
              downloadUrl = ''
            }
          }
          resolve({ storagePath: path, downloadUrl })
        }
      }, 50)
    })

    return {
      promise,
      cancel() {
        isCancelled = true
        if (timerId) {
          clearInterval(timerId)
        }
      },
    }
  },
})
