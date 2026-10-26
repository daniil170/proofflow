import type { Middleware } from 'grammy'
import type { BotContext } from '../types.js'
import { config } from '../../shared/config.js'
import { TEXTS } from '../../shared/texts.js'

export const createRateLimiter = (): Middleware<BotContext> => {
  const userTimestamps = new Map<number, number[]>()

  setInterval(() => {
    const now = Date.now()
    for (const [userId, timestamps] of userTimestamps.entries()) {
      const active = timestamps.filter((t) => now - t < 2000)
      if (active.length === 0) {
        userTimestamps.delete(userId)
      } else {
        userTimestamps.set(userId, active)
      }
    }
  }, 60000).unref()

  return async (ctx, next) => {
    const userId = ctx.from?.id
    if (!userId) {
      return next()
    }

    const now = Date.now()
    const history = userTimestamps.get(userId) || []
    const windowStart = now - 1000
    const recent = history.filter((timestamp) => timestamp > windowStart)

    if (recent.length >= config.rateLimitPerSecond) {
      if (recent.length === config.rateLimitPerSecond) {
        await ctx.reply(TEXTS.validation.rateLimit)
      }
      return
    }

    recent.push(now)
    userTimestamps.set(userId, recent)
    return next()
  }
}
