import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generate, generateSecret } from 'otplib'
import { decryptSensitive, encryptSensitive } from '../common/utils/secure-crypto.js'
import { hashOneTimeToken } from '../modules/auth/auth.tokens.js'

const mocks = vi.hoisted(() => ({
  userRepository: {
    findMfaState: vi.fn(),
    setMfaSetup: vi.fn(),
    enableMfa: vi.fn(),
    consumeMfaRecoveryCode: vi.fn(),
    disableMfa: vi.fn(),
    revokeSessions: vi.fn(),
  },
  revokeAllForUser: vi.fn(),
  auditRecord: vi.fn(),
}))

vi.mock('../modules/auth/user.repository.js', () => ({ userRepository: mocks.userRepository }))
vi.mock('../modules/auth/auth-session.repository.js', () => ({ authSessionRepository: { revokeAllForUser: mocks.revokeAllForUser } }))
vi.mock('../common/audit/security-audit.repository.js', () => ({ securityAuditRepository: { record: mocks.auditRecord } }))

import { mfaService } from '../modules/auth/mfa.service.js'

function mfaUser(overrides = {}) {
  return {
    _id: 'user-id',
    email: 'person@example.com',
    mfaEnabled: true,
    mfaSecretEncrypted: encryptSensitive(generateSecret()),
    mfaRecoveryCodeHashes: [],
    verifyPassword: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
}

describe('TOTP MFA service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.userRepository.setMfaSetup.mockResolvedValue({ modifiedCount: 1 })
    mocks.userRepository.enableMfa.mockResolvedValue({ modifiedCount: 1 })
    mocks.userRepository.disableMfa.mockResolvedValue({ modifiedCount: 1 })
    mocks.userRepository.consumeMfaRecoveryCode.mockResolvedValue({ modifiedCount: 0 })
    mocks.revokeAllForUser.mockResolvedValue({ modifiedCount: 1 })
    mocks.auditRecord.mockResolvedValue({})
  })

  it('encrypts the setup secret and returns an authenticator URI', async () => {
    mocks.userRepository.findMfaState.mockResolvedValue({ _id: 'user-id', email: 'person@example.com', mfaEnabled: false })
    const setup = await mfaService.setup('user-id')
    const [userId, storedSecret, expiresAt] = mocks.userRepository.setMfaSetup.mock.calls[0]
    expect(userId).toBe('user-id')
    expect(storedSecret).not.toBe(setup.secret)
    expect(decryptSensitive(storedSecret)).toBe(setup.secret)
    expect(setup.otpauthUrl).toMatch(/^otpauth:\/\/totp\//)
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('verifies setup codes and returns recovery codes only after enablement', async () => {
    const secret = generateSecret()
    const encryptedSecret = encryptSensitive(secret)
    mocks.userRepository.findMfaState.mockResolvedValue({
      _id: 'user-id',
      mfaPendingSecretEncrypted: encryptedSecret,
      mfaSetupExpiresAt: new Date(Date.now() + 60_000),
    })
    const result = await mfaService.enable('user-id', await generate({ secret }))
    const update = mocks.userRepository.enableMfa.mock.calls[0][0]
    expect(update.encryptedSecret).toBe(encryptedSecret)
    expect(update.recoveryCodeHashes).toHaveLength(10)
    expect(result.recoveryCodes).toHaveLength(10)
    expect(update.recoveryCodeHashes).toEqual(result.recoveryCodes.map(hashOneTimeToken))
    expect(mocks.userRepository.revokeSessions).toHaveBeenCalledWith('user-id')
    expect(mocks.revokeAllForUser).toHaveBeenCalledWith('user-id', expect.any(Date))
  })

  it('rejects invalid TOTP codes', async () => {
    const secret = generateSecret()
    mocks.userRepository.findMfaState.mockResolvedValue({
      _id: 'user-id',
      mfaPendingSecretEncrypted: encryptSensitive(secret),
      mfaSetupExpiresAt: new Date(Date.now() + 60_000),
    })
    await expect(mfaService.enable('user-id', '000000')).rejects.toMatchObject({ code: 'MFA_CODE_INVALID' })
    expect(mocks.userRepository.enableMfa).not.toHaveBeenCalled()
  })

  it('consumes recovery codes atomically after an invalid TOTP', async () => {
    const recoveryCode = 'a'.repeat(24)
    const user = mfaUser()
    mocks.userRepository.consumeMfaRecoveryCode.mockResolvedValue({ modifiedCount: 1 })
    expect(await mfaService.verifyLoginCode(user, recoveryCode)).toBe(true)
    expect(mocks.userRepository.consumeMfaRecoveryCode).toHaveBeenCalledWith('user-id', hashOneTimeToken(recoveryCode))
  })

  it('requires password and MFA code to disable MFA, then revokes sessions', async () => {
    const secret = generateSecret()
    const user = mfaUser({ mfaSecretEncrypted: encryptSensitive(secret) })
    mocks.userRepository.findMfaState.mockResolvedValue(user)
    await mfaService.disable({ userId: 'user-id', password: 'CorrectPassword123!', code: await generate({ secret }) })
    expect(mocks.userRepository.disableMfa).toHaveBeenCalledWith('user-id')
    expect(mocks.revokeAllForUser).toHaveBeenCalledWith('user-id', expect.any(Date))
    expect(mocks.auditRecord).toHaveBeenCalledWith(expect.objectContaining({ action: 'MFA_DISABLED' }))
  })
})