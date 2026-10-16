import mongoose from 'mongoose'

const authSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refreshTokenHash: { type: String, required: true, unique: true, select: false },
  rotatedTokenHashes: { type: [String], default: [], select: false },
  tokenVersion: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
  lastRotatedAt: { type: Date, default: null },
  revokedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false, strict: 'throw' })

authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
authSessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 })

export const AuthSession = mongoose.model('AuthSession', authSessionSchema)