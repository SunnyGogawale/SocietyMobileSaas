import { env } from '../../config/env.js'
import { success } from '../../common/responses/response.js'
import { authService } from './auth.service.js'
import { mfaService } from './mfa.service.js'

export const cookieOptions = {
  httpOnly: true,
  secure: env.IS_PRODUCTION,
  sameSite: 'lax',
  path: '/api/v1',
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
}
export const refreshCookieOptions = {
  ...cookieOptions,
  path: '/api/v1/auth/refresh',
}

function setWebSessionCookies(response, session) {
  response.cookie('accessToken', session.accessToken, {
    ...cookieOptions,
    maxAge: env.JWT_ACCESS_TTL_SECONDS * 1000,
  })
  response.cookie('refreshToken', session.refreshToken, {
    ...refreshCookieOptions,
    maxAge: env.REFRESH_TOKEN_TTL_SECONDS * 1000,
  })
}

export async function login(request, response) {
  const clientType = request.get('origin') ? 'web' : request.body.clientType
  const session = await authService.login({ ...request.body, clientType })
  response.set('Cache-Control', 'no-store')
  if (session.clientType === 'web') {
    setWebSessionCookies(response, session)
    return response.status(200).json(success({ user: session.user }))
  }
  return response.status(200).json(success({
    user: session.user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  }))
}

export async function refresh(request, response) {
  const clientType = request.get('origin') ? 'web' : request.body.clientType
  const refreshToken = request.cookies?.refreshToken ?? request.body.refreshToken
  const session = await authService.refresh({ refreshToken, clientType })
  response.set('Cache-Control', 'no-store')
  if (session.clientType === 'web') {
    setWebSessionCookies(response, session)
    return response.json(success({ user: session.user }))
  }
  return response.json(success({
    user: session.user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  }))
}

export async function setupMfa(request, response) {
  const setup = await mfaService.setup(request.user._id)
  response.set('Cache-Control', 'no-store')
  return response.json(success(setup))
}

export async function enableMfa(request, response) {
  const result = await mfaService.enable(request.user._id, request.body.code)
  response.set('Cache-Control', 'no-store')
  return response.json(success({
    enabled: true,
    recoveryCodes: result.recoveryCodes,
    message: 'MFA enabled. Save your recovery codes now; they will not be shown again.',
  }))
}

export async function disableMfa(request, response) {
  await mfaService.disable({ userId: request.user._id, ...request.body })
  response.set('Cache-Control', 'no-store')
  return response.json(success({ enabled: false, message: 'MFA disabled. Sign in again.' }))
}

export async function signup(request, response) {
  const result = await authService.signup(request.body)
  response.set('Cache-Control', 'no-store')
  return response.status(201).json(success({
    user: result.user,
    message: result.emailSent
      ? 'Account created. Check your email to verify your address.'
      : 'Account created, but verification email delivery is unavailable. Contact your society administrator.',
  }))
}

export async function bootstrapSuperAdmin(request, response) {
  const user = await authService.bootstrapSuperAdmin({
    ...request.body,
    bootstrapSecret: request.get('x-bootstrap-secret'),
    sourceIp: request.ip,
  })
  response.set('Cache-Control', 'no-store')
  return response.status(201).json(success({ user, message: 'Initial Super Admin created. Sign in to continue.' }))
}

export async function verifyEmail(request, response) {
  await authService.verifyEmail(request.body)
  return response.json(success({ message: 'Email verified. You can now sign in.' }))
}

export async function forgotPassword(request, response) {
  await authService.requestPasswordReset(request.body)
  response.set('Cache-Control', 'no-store')
  return response.json(success({ message: 'If an account matches that email, reset instructions will be sent shortly.' }))
}

export async function resetPassword(request, response) {
  await authService.resetPassword(request.body)
  response.set('Cache-Control', 'no-store')
  return response.json(success({ message: 'Password updated. Sign in again with your new password.' }))
}

export async function createInvitation(request, response) {
  const invitation = await authService.createInvitation({ ...request.body, user: request.user })
  return response.status(201).json(success({
    message: 'Invitation sent.',
    email: invitation.email,
    expiresAt: invitation.expiresAt,
  }))
}

export async function logout(request, response) {
  await authService.revokeSession(request.auth.sessionId, request.user._id)
  response.clearCookie('accessToken', cookieOptions)
  response.clearCookie('refreshToken', refreshCookieOptions)
  return response.status(204).end()
}

export function currentSession(request, response) {
  response.set('Cache-Control', 'no-store')
  if (!request.user) return response.json(success({ authenticated: false, user: null }))
  return response.json(success({
    authenticated: true,
    user: {
      id: request.user._id.toString(),
      email: request.user.email,
      fullName: request.user.fullName,
      role: request.user.role,
      societyId: request.user.societyId?.toString() ?? null,
      mfaEnabled: Boolean(request.user.mfaEnabled),
    },
  }))
}