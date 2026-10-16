import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROLES } from '@society/constants'
import { hashOneTimeToken } from '../modules/auth/auth.tokens.js'

const mocks = vi.hoisted(() => ({
  userRepository: {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findForAuthentication: vi.fn(),
    setPasswordResetToken: vi.fn(),
    consumePasswordResetToken: vi.fn(),
    updateLastLogin: vi.fn(),
    revokeSessions: vi.fn(),
    deleteById: vi.fn(),
  },
  invitationRepository: {
    create: vi.fn(),
    findUsable: vi.fn(),
    consume: vi.fn(),
    deleteById: vi.fn(),
  },
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendInvitationEmail: vi.fn(),
}))

vi.mock('../modules/auth/user.repository.js', () => ({ userRepository: mocks.userRepository }))
vi.mock('../modules/auth/invitation.repository.js', () => ({ invitationRepository: mocks.invitationRepository }))
vi.mock('../modules/auth/auth.email.js', () => ({
  sendVerificationEmail: mocks.sendVerificationEmail,
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
  sendInvitationEmail: mocks.sendInvitationEmail,
}))

import { authService } from '../modules/auth/auth.service.js'

function mockUser(overrides = {}) {
  return {
    _id: { toString: () => 'user-id' },
    fullName: 'Taylor Resident',
    email: 'taylor@example.com',
    role: ROLES.RESIDENT,
    societyId: null,
    status: 'PENDING_VERIFICATION',
    ...overrides,
  }
}

describe('auth service security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.sendVerificationEmail.mockResolvedValue(true)
    mocks.sendPasswordResetEmail.mockResolvedValue(true)
    mocks.sendInvitationEmail.mockResolvedValue(true)
  })

  it('always assigns public signup the resident role and stores a verification-token hash', async () => {
    mocks.userRepository.create.mockResolvedValue(mockUser())
    await authService.signup({
      fullName: 'Taylor Resident',
      email: 'taylor@example.com',
      mobileNumber: '+14155552671',
      password: 'StrongPassword123!',
      role: ROLES.SUPER_ADMIN,
      societyId: 'attacker-society-id',
    })

    const created = mocks.userRepository.create.mock.calls[0][0]
    const emailedToken = mocks.sendVerificationEmail.mock.calls[0][0].token
    expect(created.role).toBe(ROLES.RESIDENT)
    expect(created.societyId).toBeNull()
    expect(created.emailVerificationTokenHash).toBe(hashOneTimeToken(emailedToken))
    expect(created.emailVerificationTokenHash).not.toBe(emailedToken)
  })

  it('takes an invited role and society from the stored invitation', async () => {
    mocks.invitationRepository.findUsable.mockResolvedValue({
      _id: 'invitation-id',
      role: ROLES.SOCIETY_MANAGER,
      societyId: { toString: () => 'society-id' },
    })
    mocks.invitationRepository.consume.mockResolvedValue({ modifiedCount: 1 })
    mocks.userRepository.create.mockResolvedValue(mockUser({
      role: ROLES.SOCIETY_MANAGER,
      societyId: { toString: () => 'society-id' },
    }))

    await authService.signup({
      fullName: 'Taylor Resident',
      email: 'taylor@example.com',
      mobileNumber: '+14155552671',
      password: 'StrongPassword123!',
      invitationToken: 'a'.repeat(43),
    })

    expect(mocks.userRepository.create.mock.calls[0][0]).toMatchObject({
      role: ROLES.SOCIETY_MANAGER,
      societyId: { toString: expect.any(Function) },
    })
    expect(mocks.invitationRepository.consume).toHaveBeenCalledOnce()
  })

  it('does not allow pending or unverified accounts to sign in', async () => {
    mocks.userRepository.findForAuthentication.mockResolvedValue({
      status: 'PENDING_VERIFICATION',
      emailVerified: false,
      verifyPassword: vi.fn().mockResolvedValue(true),
    })

    await expect(authService.login({ email: 'taylor@example.com', password: 'StrongPassword123!' }))
      .rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED', statusCode: 403 })
  })

  it('stores only a hash for password-reset tokens', async () => {
    mocks.userRepository.findByEmail.mockResolvedValue({
      _id: { toString: () => 'user-id' },
      email: 'taylor@example.com',
      fullName: 'Taylor Resident',
      status: 'ACTIVE',
    })
    await authService.requestPasswordReset({ email: 'taylor@example.com' })

    const [, storedHash, expiry] = mocks.userRepository.setPasswordResetToken.mock.calls[0]
    const mailedToken = mocks.sendPasswordResetEmail.mock.calls[0][0].token
    expect(storedHash).toBe(hashOneTimeToken(mailedToken))
    expect(storedHash).not.toBe(mailedToken)
    expect(expiry.getTime()).toBeGreaterThan(Date.now())
  })

  it('hashes the replacement password and consumes the reset token', async () => {
    mocks.userRepository.consumePasswordResetToken.mockResolvedValue({ _id: 'user-id' })
    const rawToken = 'b'.repeat(43)
    await authService.resetPassword({ token: rawToken, password: 'NewStrongPassword123!' })

    const [storedTokenHash, newPasswordHash] = mocks.userRepository.consumePasswordResetToken.mock.calls[0]
    expect(storedTokenHash).toBe(hashOneTimeToken(rawToken))
    expect(newPasswordHash).not.toBe('NewStrongPassword123!')
    expect(newPasswordHash).toMatch(/^\$2[aby]\$/)
  })
})