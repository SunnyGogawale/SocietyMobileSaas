import { AppError } from '../common/errors/app-error.js'

export function validateRequest(schema, source = 'body') {
  return (request, response, next) => {
    const result = schema.safeParse(request[source])
    if (!result.success) {
      return next(new AppError('Request validation failed.', {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        details: result.error.issues.map(({ path, message }) => ({ path: path.join('.'), message })),
      }))
    }

    if (source === 'query') request.validatedQuery = result.data
    else request[source] = result.data
    return next()
  }
}