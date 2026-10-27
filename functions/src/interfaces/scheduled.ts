import admin from 'firebase-admin'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { executeCleanupExpiredSources } from '../application/use-cases/cleanupExpiredSources.js'

if (!admin.apps.length) {
  admin.initializeApp()
}

export const cleanupExpiredCaseSources = onSchedule(
  {
    schedule: 'every 24 hours',
    timeZone: 'UTC',
    retryCount: 1,
    timeoutSeconds: 300,
    memory: '512MiB',
  },
  async () => {
    const db = admin.firestore()
    const bucket = admin.storage().bucket()
    await executeCleanupExpiredSources({
      db,
      bucket,
    })
  }
)
