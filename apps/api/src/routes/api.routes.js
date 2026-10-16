import { Router } from 'express'
import { API_PREFIX } from '@society/constants'
import { databaseReady } from '../config/database.js'
import { authRoutes } from '../modules/auth/auth.routes.js'
import { residentRoutes } from '../modules/residents/resident.routes.js'

export const apiRoutes = Router()

apiRoutes.get('/health/live', (request, response) => response.json({ status: 'ok' }))
apiRoutes.get('/health/ready', (request, response) => {
  const ready = databaseReady()
  return response.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', database: ready })
})
apiRoutes.use('/auth', authRoutes)
apiRoutes.use('/residents', residentRoutes)

export const apiMountPath = API_PREFIX