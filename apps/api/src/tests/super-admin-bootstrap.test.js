import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROLES } from '@society/constants'

const mocks = vi.hoisted(() => ({
  userRepository: {
    create: vi.fn(),
    findBootstrapAdmin: vi.fn(),
  },
  invitationRepository: {},
  securityAuditRecord: vi.fn(),
  env: {
    JWT_ACCESS_SECRET: 'test-secret-at-least-32-characters-long',
    JWT_ACCESS_TTL_SECONDS: 900,
    SUPER_ADMIN_BOOTSTRAP_SECRET: 'bootstrap-secret-that-is-at-least-32-characters',
    LOG_LEVEL: 'silent',
  },
}))

vi.mock('../modules/auth/user.repository.js', () => ({ userRepository: mocks.userRepository }))
vi.mock('../modules/auth/invitation.repository.js', () => ({ invitationRepository: mocks.invitationRepository }))
vi.mock('../modules/auth/auth.email.js', () => ({}))
vi.mock('../common/audit/security-audit.repository.js', () => ({
  securityAuditRepository: { record: mocks.securityAuditRecord },
}))
vi.mock('../config/env.js', () => ({ env: mocks.env }))
vi.mock('../../config/env.js', () => ({ env: { 
    JWT_ACCESS_SECRET: 'test-secret-at-least-32-characters-long',
    JWT_ACCESS_TTL_SECONDS: 900,
    SUPER_ADMIN_BOOTSTRAP_SECRET: 'bootstrap-secret-that-is-at-least-32-characters',
    LOG_LEVEL: 'silent',
} }))

import { authService } from '../modules/auth/auth.service.js'

function adminUser() {
  return {
    _id: { toString: () => 'admin-id' },
    fullName: 'Platform Admin',
    email: 'platform@example.com',
    role: ROLES.SUPER_ADMIN,
    societyId: null,
    status: 'ACTIVE',
    bootstrapAudit: { eventId: 'audit-event-id' },
  }
}

describe('one-time Super Admin bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.userRepository.findBootstrapAdmin.mockResolvedValue(null)
    mocks.securityAuditRecord.mockResolvedValue({})
  })

  it('rejects incorrect bootstrap secrets before any database write', async () => {
    await expect(authService.bootstrapSuperAdmin({ bootstrapSecret: 'wrong' }))
      .rejects.toMatchObject({ statusCode: 401, code: 'BOOTSTRAP_UNAUTHORIZED' })
    expect(mocks.userRepository.create).not.toHaveBeenCalled()
  })

  it('creates an active verified Super Admin with an embedded audit marker', async () => {
    mocks.userRepository.create.mockResolvedValue(adminUser())
    const user = await authService.bootstrapSuperAdmin({
      fullName: 'Platform Admin',
      email: 'platform@example.com',
      password: 'StrongAdminPassword123!',
      bootstrapSecret: mocks.env.SUPER_ADMIN_BOOTSTRAP_SECRET,
      sourceIp: '127.0.0.1',
    })

    const stored = mocks.userRepository.create.mock.calls[0][0]
    expect(user.role).toBe(ROLES.SUPER_ADMIN)
    expect(stored).toMatchObject({
      role: ROLES.SUPER_ADMIN,
      societyId: null,
      status: 'ACTIVE',
      emailVerified: true,
      bootstrapKey: 'initial-super-admin-v1',
    })
    expect(stored.bootstrapAudit.sourceIpHash).not.toBe('127.0.0.1')
    const audit = mocks.securityAuditRecord.mock.calls[0][0]
    expect(audit.action).toBe('SUPER_ADMIN_BOOTSTRAPPED')
    expect(JSON.stringify(audit)).not.toContain(mocks.env.SUPER_ADMIN_BOOTSTRAP_SECRET)
  })

  it('refuses another bootstrap after the unique claim exists', async () => {
    mocks.userRepository.findBootstrapAdmin.mockResolvedValue({ _id: 'admin-id' })
    await expect(authService.bootstrapSuperAdmin({
      bootstrapSecret: mocks.env.SUPER_ADMIN_BOOTSTRAP_SECRET,
    })).rejects.toMatchObject({ statusCode: 409, code: 'BOOTSTRAP_ALREADY_USED' })
    expect(mocks.userRepository.create).not.toHaveBeenCalled()
  })

  it('converts a concurrent unique-key race into the consumed response', async () => {
    mocks.userRepository.create.mockRejectedValue({
      code: 11000,
      keyPattern: { bootstrapKey: 1 },
    })
    await expect(authService.bootstrapSuperAdmin({
      bootstrapSecret: mocks.env.SUPER_ADMIN_BOOTSTRAP_SECRET,
    })).rejects.toMatchObject({ statusCode: 409, code: 'BOOTSTRAP_ALREADY_USED' })
  })
})