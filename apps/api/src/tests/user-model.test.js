import { describe, expect, it } from 'vitest'
import { ROLES } from '@society/constants'
import { User } from '../modules/auth/user.model.js'

describe('user role and status schema', () => {
  it('defaults public accounts to the resident role and pending verification', () => {
    const user = new User({ fullName: 'Taylor Resident', email: 'taylor@example.com', passwordHash: 'unused' })
    expect(user.role).toBe(ROLES.RESIDENT)
    expect(user.status).toBe('PENDING_VERIFICATION')
    expect(user.emailVerified).toBe(false)
  })

  it('supports the declared role and account-status values', () => {
    expect(User.schema.path('role').enumValues).toEqual(Object.values(ROLES))
    expect(User.schema.path('status').enumValues).toEqual(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED'])
  })

  it('declares unique email and normalized mobile indexes', () => {
    const indexes = User.schema.indexes()
    expect(indexes.some(([fields, options]) => fields.email === 1 && options.unique)).toBe(true)
    expect(indexes.some(([fields, options]) => fields.mobileNumber === 1 && options.unique && options.sparse)).toBe(true)
  })

  it('normalizes mobile numbers before persistence', () => {
    const user = new User({
      fullName: 'Taylor Resident',
      email: 'taylor@example.com',
      mobileNumber: '+1 (415) 555-2671',
      passwordHash: 'unused',
    })
    expect(user.mobileNumber).toBe('+14155552671')
  })
})