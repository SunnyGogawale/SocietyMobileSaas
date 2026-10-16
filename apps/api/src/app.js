import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { apiRateLimiter } from './middleware/rate-limiter.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { requestLogger } from './middleware/request-logger.js'
import { AppError } from './common/errors/app-error.js'
import { env } from './config/env.js'
import { openApiDocument } from './docs/openapi.js'
import { apiMountPath, apiRoutes } from './routes/api.routes.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', env.IS_PRODUCTION ? 1 : false)
  app.use(requestLogger)
  app.use(helmet())
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.WEB_ORIGINS.includes(origin)) return callback(null, true)
      return callback(new AppError('Origin is not allowed.', { statusCode: 403, code: 'CORS_ORIGIN_DENIED' }))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }))
  app.use((request, response, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next()
    const origin = request.get('origin')
    if (!origin || env.WEB_ORIGINS.includes(origin)) return next()
    return next(new AppError('Request origin is not allowed.', { statusCode: 403, code: 'ORIGIN_DENIED' }))
  })
  app.use(express.json({ limit: '1mb', strict: true }))
  app.use(express.urlencoded({ extended: false, limit: '1mb' }))
  app.use(cookieParser())
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: false }))
  app.use(apiMountPath, apiRateLimiter, apiRoutes)
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}