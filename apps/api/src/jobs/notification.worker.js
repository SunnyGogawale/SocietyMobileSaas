import { Worker } from 'bullmq'
import { createRedisConnection } from '../config/redis.js'
import { logger } from '../config/logger.js'

export function createNotificationWorker(processNotification) {
  const connection = createRedisConnection()
  if (!connection) return null
  const worker = new Worker('notifications', processNotification, { connection, concurrency: 5 })
  worker.on('failed', (job, error) => logger.error({ jobId: job?.id, err: error }, 'Notification job failed'))
  return worker
}