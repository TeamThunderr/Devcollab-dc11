import pino from 'pino'
import { env } from '../config/env.js'

const transport =
  env.NODE_ENV !== 'production'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      })
    : undefined

const rootLogger = pino(
  {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    // In production: pure JSON for log aggregation (Datadog, GCP Logging, etc.)
    // In development: colorized via pino-pretty transport above
  },
  transport,
)

/**
 * Create a child logger scoped to a specific module.
 *
 * @example
 *   const logger = createLogger('task-service')
 *   logger.info({ taskId: '...' }, 'task created')
 */
export function createLogger(module: string) {
  return rootLogger.child({ module })
}

export const logger = rootLogger
