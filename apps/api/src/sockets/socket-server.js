import { parse } from 'cookie'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { ROLES } from '@society/constants'
import { env } from '../config/env.js'
import { authSessionRepository } from '../modules/auth/auth-session.repository.js'
import { userRepository } from '../modules/auth/user.repository.js'

export function attachSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.WEB_ORIGINS, credentials: true },
    maxHttpBufferSize: 1_000_000,
  })

  io.use(async (socket, next) => {
    try {
      const bearer = socket.handshake.auth?.accessToken
      const cookies = parse(socket.request.headers.cookie ?? '')
      const token = bearer ?? cookies.accessToken
      if (!token) return next(new Error('unauthorized'))
      const claims = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: 'society-api',
        audience: 'society-clients',
      })
      const user = await userRepository.findActiveById(claims.sub)
      if (!user || (user.tokenVersion ?? 0) !== (claims.tokenVersion ?? 0)) return next(new Error('unauthorized'))
      const session = await authSessionRepository.findActive({
        sessionId: claims.sessionId,
        userId: user._id,
        tokenVersion: user.tokenVersion ?? 0,
        now: new Date(),
      })
      if (!session) return next(new Error('unauthorized'))
      socket.data.user = user
      return next()
    } catch {
      return next(new Error('unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const { user } = socket.data
    if (user.societyId) socket.join(`society:${user.societyId}`)
    if (user.role === ROLES.SUPER_ADMIN) socket.join('platform:admins')
  })

  return io
}