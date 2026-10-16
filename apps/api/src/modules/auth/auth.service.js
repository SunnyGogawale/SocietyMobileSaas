import bcrypt from 'bcryptjs'
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { PERMISSIONS, ROLES, roleHasPermission } from '@society/constants'
import { AppError } from '../../common/errors/app-error.js'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { securityAuditRepository } from '../../common/audit/security-audit.repository.js'
import { authSessionRepository } from './auth-session.repository.js'
import { sendInvitationEmail, sendPasswordResetEmail, sendVerificationEmail } from './auth.email.js'
import { invitationRepository } from './invitation.repository.js'
import { createOneTimeToken, hashOneTimeToken } from './auth.tokens.js'
import { mfaService } from './mfa.service.js'
import { userRepository } from './user.repository.js'

function mapUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    societyId: user.societyId?.toString() ?? null,
    mfaEnabled: Boolean(user.mfaEnabled),
  }
}

function createAccessToken(user, sessionId) {
  return jwt.sign({
    role: user.role,
    societyId: user.societyId?.toString() ?? null,
    tokenVersion: user.tokenVersion ?? 0,
    sessionId: sessionId.toString(),
  }, env.JWT_ACCESS_SECRET, {
    subject: user._id.toString(),
    issuer: 'society-api',
    audience: 'society-clients',
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
  })
}

async function createSessionTokens(user, clientType, { session, refreshToken } = {}) {
  const now = new Date()
  const nextRefreshToken = refreshToken ?? createOneTimeToken()
  const authSession = session ?? await authSessionRepository.create({
    userId: user._id,
    refreshTokenHash: hashOneTimeToken(nextRefreshToken),
    tokenVersion: user.tokenVersion ?? 0,
    expiresAt: new Date(now.getTime() + env.REFRESH_TOKEN_TTL_SECONDS * 1000),
  })
  return {
    user: mapUser(user),
    accessToken: createAccessToken(user, authSession._id),
    refreshToken: nextRefreshToken,
    clientType,
  }
}

export const authService = {
  async login({ email, password, clientType, mfaCode }) {
    const user = await userRepository.findForAuthentication(email)
    if (!user || !(await user.verifyPassword(password))) {
      throw new AppError('Email or password is incorrect.', { statusCode: 401, code: 'INVALID_CREDENTIALS' })
    }
    if (user.status === 'SUSPENDED') {
      throw new AppError('This account has been suspended.', { statusCode: 403, code: 'ACCOUNT_SUSPENDED' })
    }
    if (user.status !== 'ACTIVE' || !user.emailVerified) {
      throw new AppError('Verify your email before signing in.', { statusCode: 403, code: 'EMAIL_NOT_VERIFIED' })
    }
    if (user.mfaEnabled && !(await mfaService.verifyLoginCode(user, mfaCode))) {
      throw new AppError(
        mfaCode ? 'The authenticator code is invalid.' : 'An authenticator code is required.',
        { statusCode: 401, code: mfaCode ? 'MFA_CODE_INVALID' : 'MFA_REQUIRED' },
      )
    }

    await userRepository.updateLastLogin(user._id, new Date())
    return createSessionTokens(user, clientType)
  },

  async refresh({ refreshToken, clientType }) {
    if (!refreshToken) {
      throw new AppError('A refresh token is required.', { statusCode: 401, code: 'REFRESH_TOKEN_INVALID' })
    }
    const now = new Date()
    const nextRefreshToken = createOneTimeToken()
    const rotation = await authSessionRepository.rotateRefreshToken({
      oldHash: hashOneTimeToken(refreshToken),
      newHash: hashOneTimeToken(nextRefreshToken),
      now,
      expiresAt: new Date(now.getTime() + env.REFRESH_TOKEN_TTL_SECONDS * 1000),
    })
    if (!rotation) {
      throw new AppError('The refresh token is invalid or expired.', { statusCode: 401, code: 'REFRESH_TOKEN_INVALID' })
    }
    if (rotation.reused) {
      const event = {
        eventId: createOneTimeToken(),
        action: 'REFRESH_TOKEN_REUSE_DETECTED',
        targetUserId: rotation.session.userId,
        metadata: { sessionId: rotation.session._id.toString() },
      }
      try {
        await securityAuditRepository.record(event)
      } catch (error) {
        logger.error({ err: error, eventId: event.eventId }, 'Could not persist refresh-token reuse audit event')
      }
      logger.error({ userId: rotation.session.userId?.toString(), sessionId: rotation.session._id.toString() }, 'Refresh-token reuse detected; session revoked')
      throw new AppError('Session reuse detected. Sign in again.', { statusCode: 401, code: 'REFRESH_TOKEN_REUSED' })
    }

    const user = await userRepository.findActiveById(rotation.session.userId)
    if (!user || (user.tokenVersion ?? 0) !== rotation.session.tokenVersion) {
      await authSessionRepository.revoke({ sessionId: rotation.session._id, userId: rotation.session.userId, now })
      throw new AppError('The session is invalid or expired.', { statusCode: 401, code: 'REFRESH_TOKEN_INVALID' })
    }
    return createSessionTokens(user, clientType, { session: rotation.session, refreshToken: nextRefreshToken })
  },

  async signup({ fullName, email, mobileNumber, password, invitationToken }) {
    const now = new Date()
    let invitation = null
    if (invitationToken) {
      invitation = await invitationRepository.findUsable({
        email,
        tokenHash: hashOneTimeToken(invitationToken),
        now,
      })
      if (!invitation) {
        throw new AppError('This invitation is invalid or expired.', { statusCode: 400, code: 'INVITATION_INVALID' })
      }
    }

    const verificationToken = createOneTimeToken()
    let user
    try {
      user = await userRepository.create({
        fullName,
        email,
        mobileNumber,
        passwordHash: password,
        role: invitation?.role ?? ROLES.RESIDENT,
        societyId: invitation?.societyId ?? null,
        status: 'PENDING_VERIFICATION',
        emailVerified: false,
        emailVerificationTokenHash: hashOneTimeToken(verificationToken),
        emailVerificationExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      })
    } catch (error) {
      if (error?.code === 11000) {
        throw new AppError('An account already exists with this email or mobile number.', {
          statusCode: 409,
          code: 'ACCOUNT_ALREADY_EXISTS',
        })
      }
      throw error
    }

    if (invitation) {
      const consumed = await invitationRepository.consume(invitation._id, now)
      if (!consumed.modifiedCount) {
        await userRepository.deleteById(user._id)
        throw new AppError('This invitation is invalid or expired.', { statusCode: 400, code: 'INVITATION_INVALID' })
      }
    }

    const emailSent = await sendVerificationEmail({ email, fullName, token: verificationToken })
    if (!emailSent) logger.warn({ userId: user._id.toString() }, 'Account created without verification email delivery')
    return { user: mapUser(user), emailSent }
  },

  async bootstrapSuperAdmin({ fullName, email, mobileNumber, password, bootstrapSecret, sourceIp }) {
    const expected = Buffer.from(env.SUPER_ADMIN_BOOTSTRAP_SECRET)
    if (!expected.length) {
      throw new AppError('Bootstrap is not enabled.', { statusCode: 404, code: 'NOT_FOUND' })
    }
    const provided = Buffer.from(bootstrapSecret ?? '')
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      throw new AppError('Bootstrap authorization failed.', { statusCode: 401, code: 'BOOTSTRAP_UNAUTHORIZED' })
    }
    if (await userRepository.findBootstrapAdmin()) {
      throw new AppError('The initial Super Admin has already been created.', {
        statusCode: 409,
        code: 'BOOTSTRAP_ALREADY_USED',
      })
    }

    const completedAt = new Date()
    const sourceIpHash = createHash('sha256').update(sourceIp ?? 'unknown').digest('hex')
    let user
    try {
      user = await userRepository.create({
        fullName,
        email,
        ...(mobileNumber ? { mobileNumber } : {}),
        passwordHash: password,
        role: ROLES.SUPER_ADMIN,
        societyId: null,
        status: 'ACTIVE',
        emailVerified: true,
        bootstrapKey: 'initial-super-admin-v1',
        bootstrapAudit: {
          eventId: randomUUID(),
          sourceIpHash,
          completedAt,
        },
      })
    } catch (error) {
      if (error?.code !== 11000) throw error
      const alreadyBootstrapped = error.keyPattern?.bootstrapKey || error.keyValue?.bootstrapKey
      throw new AppError(
        alreadyBootstrapped
          ? 'The initial Super Admin has already been created.'
          : 'An account already exists with this email or mobile number.',
        {
          statusCode: 409,
          code: alreadyBootstrapped ? 'BOOTSTRAP_ALREADY_USED' : 'ACCOUNT_ALREADY_EXISTS',
        },
      )
    }

    const auditEvent = {
      eventId: user.bootstrapAudit.eventId,
      action: 'SUPER_ADMIN_BOOTSTRAPPED',
      targetUserId: user._id,
      sourceIpHash,
      metadata: { bootstrapKey: 'initial-super-admin-v1' },
    }
    try {
      await securityAuditRepository.record(auditEvent)
    } catch (error) {
      logger.fatal({ err: error, userId: user._id.toString(), eventId: auditEvent.eventId }, 'Bootstrap audit insert failed; user record retains the bootstrap audit metadata')
    }
    logger.warn({ userId: user._id.toString(), eventId: auditEvent.eventId }, 'Initial Super Admin bootstrapped')
    return mapUser(user)
  },

  async verifyEmail({ token }) {
    const user = await userRepository.consumeEmailVerificationToken(hashOneTimeToken(token), new Date())
    if (!user) {
      throw new AppError('This verification link is invalid or expired.', {
        statusCode: 400,
        code: 'VERIFICATION_LINK_INVALID',
      })
    }
    return mapUser(user)
  },

  async requestPasswordReset({ email }) {
    const user = await userRepository.findByEmail(email)
    if (!user || user.status === 'SUSPENDED') return

    const token = createOneTimeToken()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
    await userRepository.setPasswordResetToken(email, hashOneTimeToken(token), expiresAt)
    await sendPasswordResetEmail({ email, fullName: user.fullName, token })
  },

  async resetPassword({ token, password }) {
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await userRepository.consumePasswordResetToken(
      hashOneTimeToken(token),
      passwordHash,
      new Date(),
    )
    if (!user) {
      throw new AppError('This password reset link is invalid or expired.', {
        statusCode: 400,
        code: 'RESET_LINK_INVALID',
      })
    }
    return true
  },

  async createInvitation({ email, role, user }) {
    const managerRoles = [ROLES.COMMITTEE_MEMBER, ROLES.RESIDENT, ROLES.TENANT, ROLES.VENDOR]
    const adminRoles = [
      ROLES.SOCIETY_MANAGER,
      ROLES.COMMITTEE_MEMBER,
      ROLES.ACCOUNTANT,
      ROLES.SECURITY_GUARD,
      ROLES.MAINTENANCE_STAFF,
      ROLES.RESIDENT,
      ROLES.TENANT,
      ROLES.VENDOR,
    ]
    const allowedRoles = user.role === ROLES.SOCIETY_ADMIN ? adminRoles : managerRoles
    if (!roleHasPermission(user.role, PERMISSIONS.INVITATIONS_WRITE) || !allowedRoles.includes(role)) {
      throw new AppError('You cannot invite a user with this role.', { statusCode: 403, code: 'FORBIDDEN' })
    }

    const token = createOneTimeToken()
    const invitation = await invitationRepository.create({
      email,
      role,
      societyId: user.societyId,
      createdBy: user._id,
      tokenHash: hashOneTimeToken(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    const emailSent = await sendInvitationEmail({ email, token })
    if (!emailSent) {
      await invitationRepository.deleteById(invitation._id)
      throw new AppError('Invitation email could not be delivered. Check the mail configuration and try again.', {
        statusCode: 503,
        code: 'EMAIL_DELIVERY_UNAVAILABLE',
      })
    }
    return { email, expiresAt: invitation.expiresAt }
  },

  revokeSession(sessionId, userId) {
    return authSessionRepository.revoke({ sessionId, userId, now: new Date() })
  },

  async revokeSessions(userId) {
    const now = new Date()
    await userRepository.revokeSessions(userId)
    return authSessionRepository.revokeAllForUser(userId, now)
  },
}