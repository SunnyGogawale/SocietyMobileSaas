import { Queue } from 'bullmq'
import { createRedisConnection } from '../config/redis.js'

export function createQueue(name) {
  const connection = createRedisConnection()
  if (!connection) return null
  const queue = new Queue(name, { connection })
  queue.on('error', (error) => console.error(`Queue ${name} error`, error))
  return queue
}