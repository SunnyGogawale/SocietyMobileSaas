import { AuthSession } from './auth-session.model.js'

export const authSessionRepository = {
  create(input) {
    return AuthSession.create(input)
  },

  findActive({ sessionId, userId, tokenVersion, now }) {
    return AuthSession.findOne({
      _id: sessionId,
      userId,
      tokenVersion,
      revokedAt: null,
      expiresAt: { $gt: now },
    }).select('_id userId tokenVersion expiresAt')
  },

  async rotateRefreshToken({ oldHash, newHash, now, expiresAt }) {
    const session = await AuthSession.findOneAndUpdate({
      refreshTokenHash: oldHash,
      revokedAt: null,
      expiresAt: { $gt: now },
    }, {
      $set: { refreshTokenHash: newHash, expiresAt, lastRotatedAt: now },
      $push: { rotatedTokenHashes: { $each: [oldHash], $slice: -64 } },
    }, { new: true }).select('_id userId tokenVersion expiresAt')

    if (session) return { session, reused: false }

    const previousUse = await AuthSession.findOne({ rotatedTokenHashes: oldHash, revokedAt: null })
      .select('_id userId')
    if (!previousUse) return null
    await AuthSession.updateOne({ _id: previousUse._id, revokedAt: null }, { $set: { revokedAt: now } })
    return { session: previousUse, reused: true }
  },

  revoke({ sessionId, userId, now }) {
    return AuthSession.updateOne({ _id: sessionId, userId, revokedAt: null }, { $set: { revokedAt: now } })
  },

  revokeAllForUser(userId, now) {
    return AuthSession.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: now } })
  },

  countByState(now) {
    return AuthSession.aggregate([
      { $match: { expiresAt: { $gt: now } } },
      { $group: { _id: { $cond: [{ $eq: ['$revokedAt', null] }, 'active', 'revoked'] }, count: { $sum: 1 } } },
    ])
  },
}