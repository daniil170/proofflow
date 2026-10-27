import type { firestore } from 'firebase-admin'
import { STORAGE_RETENTION_DAYS } from '../../domain/limits.js'

export interface StorageBucketLike {
  file: (path: string) => {
    delete: (options?: { ignoreNotFound?: boolean }) => Promise<unknown>
  }
  deleteFiles: (options: { prefix: string; force?: boolean }) => Promise<unknown>
}

export interface CleanupExpiredSourcesInput {
  db: firestore.Firestore
  bucket: StorageBucketLike
  retentionDays?: number
  now?: number
}

export interface CleanupExpiredSourcesResult {
  cleanedCount: number
  totalChecked: number
  retentionDays: number
  cutoff: number
}

export const executeCleanupExpiredSources = async ({
  db,
  bucket,
  retentionDays = STORAGE_RETENTION_DAYS,
  now = Date.now(),
}: CleanupExpiredSourcesInput): Promise<CleanupExpiredSourcesResult> => {
  const dayMs = 24 * 60 * 60 * 1000
  const cutoff = now - retentionDays * dayMs

  const snapshot = await db
    .collection('cases')
    .where('status', 'in', ['ready', 'published'])
    .get()

  let cleanedCount = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    if (data.sourcesCleaned === true) {
      continue
    }

    const timestamp = data.readyAt || data.updatedAt || data.createdAt || 0
    if (timestamp > cutoff) {
      continue
    }

    if (Array.isArray(data.sources)) {
      for (const src of data.sources) {
        if (src && typeof src.storagePath === 'string') {
          try {
            await bucket.file(src.storagePath).delete({ ignoreNotFound: true })
          } catch {
            continue
          }
        }
      }
    }

    try {
      await bucket.deleteFiles({ prefix: `cases/${doc.id}/`, force: true })
    } catch {
      continue
    }

    await doc.ref.update({
      sourcesCleaned: true,
      sourcesCleanedAt: now,
    })

    cleanedCount += 1
  }

  return {
    cleanedCount,
    totalChecked: snapshot.size,
    retentionDays,
    cutoff,
  }
}
