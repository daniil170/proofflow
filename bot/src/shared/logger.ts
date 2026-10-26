export interface Logger {
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, error?: unknown, context?: Record<string, unknown>): void
}

const formatContext = (context?: Record<string, unknown>): string => {
  if (!context || Object.keys(context).length === 0) return ''
  return ` | ${JSON.stringify(context)}`
}

export const logger: Logger = {
  info(message: string, context?: Record<string, unknown>) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}${formatContext(context)}`)
  },
  warn(message: string, context?: Record<string, unknown>) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}${formatContext(context)}`)
  },
  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const errorDetails =
      error instanceof Error ? ` | ${error.name}: ${error.message}\n${error.stack}` : ''
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}${formatContext(context)}${errorDetails}`
    )
  },
}
