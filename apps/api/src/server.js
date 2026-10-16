import 'dotenv/config'
import { createServer } from 'node:http'
import { createApp } from './app.js'
import { connectDatabase, databaseReady, disconnectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { attachSocketServer } from './sockets/socket-server.js'

const app = createApp()
const server = createServer(app)
const io = attachSocketServer(server)
let connecting = false

async function connectWithRetry() {
  if (connecting || databaseReady()) return
  connecting = true
  try {
    await connectDatabase()
    logger.info('MongoDB connected')
  } catch (error) {
    logger.error({ err: error }, 'MongoDB unavailable; readiness remains false')
  } finally {
    connecting = false
  }
}

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT, environment: env.NODE_ENV }, 'Society API listening')
  void connectWithRetry()
})

const retryTimer = setInterval(() => {
  void connectWithRetry()
}, 10_000)
retryTimer.unref()

async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down')
  clearInterval(retryTimer)
  io.close()
  server.close(async () => {
    await disconnectDatabase()
    process.exit(0)
  })
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))