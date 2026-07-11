import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { env } from '../config/env.js'
import { createLogger } from '../lib/logger.js'
import * as schema from './schema.js'

const logger = createLogger('db')

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle database client')
})

pool.on('connect', () => {
  logger.debug('New database client connected')
})

export const db = drizzle(pool, { schema, logger: env.NODE_ENV !== 'production' })
