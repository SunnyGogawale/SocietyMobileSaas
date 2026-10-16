import IORedis from 'ioredis'
import { env } from './env.js'

export function createRedisConnection() {
  if (!env.REDIS_URL) return null
  return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: true })
}