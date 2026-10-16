import { ROLES } from '@society/constants'
import { AppError } from '../common/errors/app-error.js'

export function attachTenantContext(request, response, next) {
  const societyId = request.user?.societyId?.toString()
  request.tenant = societyId ? { societyId } : null
  return next()
}

export function requireTenant(request, response, next) {
  if (request.user?.role === ROLES.SUPER_ADMIN || !request.tenant?.societyId) {
    return next(new AppError('A society-scoped session is required.', {
      statusCode: 403,
      code: 'TENANT_CONTEXT_REQUIRED',
    }))
  }
  return next()
}