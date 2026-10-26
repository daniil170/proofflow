import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import { getFirebaseApp } from '../firebase/app.js'

export const firebaseSourceUploader = Object.freeze({
  upload(file, path, onProgress) {
    const storage = getStorage(getFirebaseApp())
    const storageRef = ref(storage, path)
    const uploadTask = uploadBytesResumable(storageRef, file)

    let isCancelled = false

    const promise = new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (isCancelled) return
          const progress =
            snapshot.totalBytes > 0
              ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
              : 0
          if (onProgress) {
            onProgress(progress)
          }
        },
        (error) => {
          reject(error)
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(storageRef)
            resolve({ storagePath: path, downloadUrl })
          } catch {
            resolve({ storagePath: path })
          }
        }
      )
    })

    return {
      promise,
      cancel() {
        isCancelled = true
        uploadTask.cancel()
      },
    }
  },
})
