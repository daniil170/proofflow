import { firebaseSourceUploader } from './firebaseSourceUploader.js'
import { mockSourceUploader } from './mockSourceUploader.js'

export { firebaseSourceUploader } from './firebaseSourceUploader.js'
export { mockSourceUploader } from './mockSourceUploader.js'

export const getSourceUploader = () => {
  const isMockExplicitlyRequested = import.meta.env.VITE_USE_MOCK_API === 'true'
  const hasFirebaseStorageBucket = Boolean(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)
  const hasFirebaseProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

  if (isMockExplicitlyRequested || !hasFirebaseStorageBucket || !hasFirebaseProjectId) {
    return mockSourceUploader
  }

  return firebaseSourceUploader
}
