import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from '../common/errors/app-error.js'
import { authSessionRepository } from '../modules/auth/auth-session.repository.js'
import { userRepository } from '../modules/auth/user.repository.js'

async function resolveSessionUser(request) {
  const bearerToken = request.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const token = bearerToken ?? request.cookies?.accessToken
  if (!token) return null

  let claims
  try {
    claims = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'society-api',
      audience: 'society-clients',
    })
  } catch {
    return null
  }

  const user = await userRepository.findActiveById(claims.sub)
  if (!user || !claims.sessionId || (user.tokenVersion ?? 0) !== (claims.tokenVersion ?? 0)) return null
  const session = await authSessionRepository.findActive({
    sessionId: claims.sessionId,
    userId: user._id,
    tokenVersion: user.tokenVersion ?? 0,
    now: new Date(),
  })
  if (!session) return null
  return { user, sessionId: session._id.toString() }
}

export async function optionalAuthenticate(request, response, next) {
  try {
    const session = await resolveSessionUser(request)
    request.user = session?.user ?? null
    request.auth = session ? { sessionId: session.sessionId } : null
    return next()
  } catch (error) {
    return next(error)
  }
}

export async function authenticate(request, response, next) {
  try {
    const session = await resolveSessionUser(request)
    if (!session) {
      return next(new AppError('Authentication is required.', { statusCode: 401, code: 'UNAUTHENTICATED' }))
    }
    request.user = session.user
    request.auth = { sessionId: session.sessionId }
  } catch (error) {
    return next(error)
  }
  return next()
}