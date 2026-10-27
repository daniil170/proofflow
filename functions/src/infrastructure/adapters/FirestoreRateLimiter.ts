import type { Firestore } from 'firebase-admin/firestore'
import { RateLimitConfig } from '../../domain/rateLimits.js'
import { RateLimiter, RateLimitResult } from '../ports/RateLimiter.js'

export class FirestoreRateLimiter implements RateLimiter {
  constructor(
    private db: Firestore,
    private collectionName = 'rate_limits'
  ) {}

  private sanitizeKey(rawKey: string): string {
    return rawKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)
  }

  async consume(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const docId = this.sanitizeKey(key)
    const docRef = this.db.collection(this.collectionName).doc(docId)
    const now = Date.now()

    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef)
      const data = snap.exists ? snap.data() : null

      const blockedUntil = typeof data?.blockedUntil === 'number' ? data.blockedUntil : 0
      if (blockedUntil > now) {
        return {
          isLimited: true,
          remaining: 0,
          resetTimeMs: blockedUntil,
        }
      }

      const existingTimestamps: number[] = Array.isArray(data?.timestamps)
        ? data.timestamps.filter((t: unknown) => typeof t === 'number' && now - t < config.windowMs)
        : []

      if (existingTimestamps.length >= config.maxRequests) {
        const blockDuration = config.blockDurationMs || config.windowMs
        const newBlockedUntil = now + blockDuration
        transaction.set(docRef, {
          timestamps: existingTimestamps,
          blockedUntil: newBlockedUntil,
          updatedAt: now,
        })
        return {
          isLimited: true,
          remaining: 0,
          resetTimeMs: newBlockedUntil,
        }
      }

      existingTimestamps.push(now)
      transaction.set(docRef, {
        timestamps: existingTimestamps,
        blockedUntil: 0,
        updatedAt: now,
      })

      return {
        isLimited: false,
        remaining: config.maxRequests - existingTimestamps.length,
        resetTimeMs: existingTimestamps[0] + config.windowMs,
      }
    })
  }

  async isRateLimited(key: string, config: RateLimitConfig): Promise<boolean> {
    const result = await this.consume(key, config)
    return result.isLimited
  }
}
