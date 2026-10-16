import { randomBytes } from 'node:crypto'
import { generateSecret, generateURI, verify } from 'otplib'
import { AppError } from '../../common/errors/app-error.js'
import { securityAuditRepository } from '../../common/audit/security-audit.repository.js'
import { decryptSensitive, encryptSensitive } from '../../common/utils/secure-crypto.js'
import { authSessionRepository } from './auth-session.repository.js'
import { createOneTimeToken, hashOneTimeToken } from './auth.tokens.js'
import { userRepository } from './user.repository.js'

async function validTotp(secret, code) {
  if (!/^\d{6}$/.test(code ?? '')) return false
  const result = await verify({ secret, token: code })
  return result.valid
}

export const mfaService = {
  async verifyLoginCode(user, code) {
    if (!user.mfaEnabled) return true
    if (!code) return false

    if (await validTotp(decryptSensitive(user.mfaSecretEncrypted), code)) return true
    const recoveryResult = await userRepository.consumeMfaRecoveryCode(user._id, hashOneTimeToken(code))
    return recoveryResult.modifiedCount === 1
  },

  async setup(userId) {
    const user = await userRepository.findMfaState(userId)
    if (!user) throw new AppError('The account is unavailable.', { statusCode: 404, code: 'ACCOUNT_UNAVAILABLE' })
    if (user.mfaEnabled) throw new AppError('MFA is already enabled.', { statusCode: 409, code: 'MFA_ALREADY_ENABLED' })

    const secret = generateSecret()
    const encryptedSecret = encryptSensitive(secret)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    const result = await userRepository.setMfaSetup(user._id, encryptedSecret, expiresAt)
    if (result.modifiedCount !== 1) {
      throw new AppError('MFA setup could not be started.', { statusCode: 409, code: 'MFA_SETUP_CONFLICT' })
    }
    await securityAuditRepository.record({
      eventId: createOneTimeToken(),
      action: 'MFA_SETUP_STARTED',
      actorUserId: user._id,
      targetUserId: user._id,
      metadata: { expiresAt },
    })
    return {
      secret,
      otpauthUrl: generateURI({ issuer: 'SocietyOS', label: user.email, secret }),
      expiresAt,
    }
  },

  async enable(userId, code) {
    const user = await userRepository.findMfaState(userId)
    if (!user?.mfaPendingSecretEncrypted || !user.mfaSetupExpiresAt || user.mfaSetupExpiresAt <= new Date()) {
      throw new AppError('Start MFA setup again; the setup session expired.', { statusCode: 400, code: 'MFA_SETUP_EXPIRED' })
    }
    const secret = decryptSensitive(user.mfaPendingSecretEncrypted)
    if (!(await validTotp(secret, code))) {
      throw new AppError('The authenticator code is invalid.', { statusCode: 400, code: 'MFA_CODE_INVALID' })
    }

    const recoveryCodes = Array.from({ length: 10 }, () => randomBytes(12).toString('hex'))
    const result = await userRepository.enableMfa({
      id: user._id,
      pendingSecret: user.mfaPendingSecretEncrypted,
      encryptedSecret: user.mfaPendingSecretEncrypted,
      recoveryCodeHashes: recoveryCodes.map(hashOneTimeToken),
      now: new Date(),
    })
    if (result.modifiedCount !== 1) {
      throw new AppError('MFA setup changed. Start again.', { statusCode: 409, code: 'MFA_SETUP_CONFLICT' })
    }
    const now = new Date()
    await userRepository.revokeSessions(user._id)
    await authSessionRepository.revokeAllForUser(user._id, now)

    await securityAuditRepository.record({
      eventId: createOneTimeToken(),
      action: 'MFA_ENABLED',
      actorUserId: user._id,
      targetUserId: user._id,
      metadata: { method: 'totp', recoveryCodeCount: recoveryCodes.length, sessionsRevoked: true },
    })
    return { recoveryCodes }
  },

  async disable({ userId, password, code }) {
    const user = await userRepository.findMfaState(userId)
    if (!user || !(await user.verifyPassword(password)) || !user.mfaEnabled || !(await this.verifyLoginCode(user, code))) {
      throw new AppError('Password or MFA code is incorrect.', { statusCode: 401, code: 'INVALID_CREDENTIALS' })
    }
    const result = await userRepository.disableMfa(user._id)
    if (result.modifiedCount !== 1) {
      throw new AppError('MFA state changed. Try again.', { statusCode: 409, code: 'MFA_STATE_CONFLICT' })
    }
    await authSessionRepository.revokeAllForUser(user._id, new Date())
    await securityAuditRepository.record({
      eventId: createOneTimeToken(),
      action: 'MFA_DISABLED',
      actorUserId: user._id,
      targetUserId: user._id,
      metadata: { method: 'user_action' },
    })
    return true
  },
}