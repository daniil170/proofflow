import { RateLimitConfig } from '../../domain/rateLimits.js'

export interface RateLimitResult {
  isLimited: boolean
  remaining: number
  resetTimeMs: number
}

export interface RateLimiter {
  consume(key: string, config: RateLimitConfig): Promise<RateLimitResult>
  isRateLimited(key: string, config: RateLimitConfig): Promise<boolean>
}
