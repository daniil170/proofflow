export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  blockDurationMs?: number
}

export const RATE_LIMIT_CONFIGS = Object.freeze({
  PUBLIC_CASE_READ: {
    windowMs: Number(process.env.RATE_LIMIT_PUBLIC_CASE_WINDOW_MS) || 60 * 1000,
    maxRequests: Number(process.env.RATE_LIMIT_PUBLIC_CASE_MAX_REQS) || 60,
  },
  APPLICATION_SUBMISSION: {
    windowMs: Number(process.env.RATE_LIMIT_APPLICATION_WINDOW_MS) || 10 * 60 * 1000,
    maxRequests: Number(process.env.RATE_LIMIT_APPLICATION_MAX_REQS) || 10,
  },
  INVITE_ATTEMPTS: {
    windowMs: Number(process.env.RATE_LIMIT_INVITE_WINDOW_MS) || 15 * 60 * 1000,
    maxRequests: Number(process.env.RATE_LIMIT_INVITE_MAX_REQS) || 5,
    blockDurationMs: Number(process.env.RATE_LIMIT_INVITE_BLOCK_MS) || 15 * 60 * 1000,
  },
})
