import { Router } from 'express'
import { PERMISSIONS } from '@society/constants'
import { residentCreateSchema, residentListQuerySchema } from '@society/validation'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { attachTenantContext, requireTenant } from '../../middleware/tenant-context.js'
import { validateRequest } from '../../middleware/validate-request.js'
import { createResident, listResidents } from './resident.controller.js'

export const residentRoutes = Router()

residentRoutes.use(authenticate, attachTenantContext, requireTenant)
residentRoutes.get('/', authorize(PERMISSIONS.RESIDENTS_READ), validateRequest(residentListQuerySchema, 'query'), listResidents)
residentRoutes.post('/', authorize(PERMISSIONS.RESIDENTS_WRITE), validateRequest(residentCreateSchema), createResident)