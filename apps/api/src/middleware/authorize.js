import { roleHasPermission } from '@society/constants'
import { AppError } from '../common/errors/app-error.js'

export function authorize(...permissions) {
  return (request, response, next) => {
    if (!request.user || !permissions.every((permission) => roleHasPermission(request.user.role, permission))) {
      return next(new AppError('You do not have permission to perform this action.', {
        statusCode: 403,
        code: 'FORBIDDEN',
      }))
    }
    return next()
  }
}