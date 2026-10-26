export interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  backoffFactor?: number
  shouldRetry?: (error: unknown) => boolean
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const maxRetries = options.maxRetries ?? 3
  const initialDelayMs = options.initialDelayMs ?? 500
  const backoffFactor = options.backoffFactor ?? 2

  let attempt = 0
  let currentDelay = initialDelayMs

  while (attempt < maxRetries) {
    try {
      return await operation()
    } catch (error) {
      attempt += 1
      if (attempt >= maxRetries) {
        throw error
      }
      if (options.shouldRetry && !options.shouldRetry(error)) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, currentDelay))
      currentDelay *= backoffFactor
    }
  }

  throw new Error('RETRY_EXHAUSTED')
}
