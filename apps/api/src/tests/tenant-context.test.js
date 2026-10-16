import { describe, expect, it } from 'vitest'
import { ROLES } from '@society/constants'
import { attachTenantContext, requireTenant } from '../middleware/tenant-context.js'
import { authorize } from '../middleware/authorize.js'

describe('tenant and permission boundaries', () => {
  it('derives the tenant from the authenticated account, not the query string', () => {
    const request = {
      user: { role: ROLES.SOCIETY_ADMIN, societyId: 'trusted-society-id' },
      query: { societyId: 'attacker-society-id' },
    }
    attachTenantContext(request, {}, () => {})
    expect(request.tenant.societyId).toBe('trusted-society-id')
  })

  it('blocks platform administrators from tenant-only routes', () => {
    let error
    requireTenant({ user: { role: ROLES.SUPER_ADMIN }, tenant: null }, {}, (nextError) => { error = nextError })
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('TENANT_CONTEXT_REQUIRED')
  })

  it('denies permissions that are not assigned to the role', () => {
    let error
    authorize('finance:write')({ user: { role: ROLES.RESIDENT } }, {}, (nextError) => { error = nextError })
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('FORBIDDEN')
  })
})