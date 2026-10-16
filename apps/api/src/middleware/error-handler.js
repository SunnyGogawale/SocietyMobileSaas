import { AppError } from '../common/errors/app-error.js'
import { logger } from '../config/logger.js'

export function notFoundHandler(request, response, next) {
  next(new AppError('The requested resource was not found.', { statusCode: 404, code: 'NOT_FOUND' }))
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error)

  const appError = error instanceof AppError ? error : null
  const statusCode = appError?.statusCode ?? (error?.name === 'ValidationError' ? 400 : 500)
  const code = appError?.code ?? (error?.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR')
  if (statusCode >= 500) logger.error({ err: error, requestId: request.id }, 'Request failed')

  return response.status(statusCode).json({
    error: {
      code,
      message: appError?.message ?? (statusCode === 500 ? 'An unexpected error occurred.' : error.message),
      ...(appError?.details ? { details: appError.details } : {}),
      requestId: request.id,
    },
  })
}