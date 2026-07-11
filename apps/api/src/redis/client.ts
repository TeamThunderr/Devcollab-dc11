import Redis from 'ioredis'
import { env } from '../config/env.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('redis')

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
})

redis.on('connect', () => {
  logger.info('Redis client connected')
})

redis.on('ready', () => {
  logger.info('Redis client ready')
})

redis.on('error', (err) => {
  logger.error({ err }, 'Redis client error')
})

redis.on('close', () => {
  logger.warn('Redis connection closed')
})

redis.on('reconnecting', (delay: number) => {
  logger.warn({ delay }, 'Redis client reconnecting')
})
