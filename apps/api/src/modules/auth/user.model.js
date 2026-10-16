import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { ROLES } from '@society/constants'

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  mobileNumber: {
    type: String,
    trim: true,
    maxlength: 16,
    set(value) { return typeof value === 'string' ? value.replace(/[\s().-]/g, '') : value },
    validate: {
      validator(value) { return value == null || /^\+[1-9]\d{7,14}$/.test(value) },
      message: 'Mobile number must use international format.',
    },
  },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.RESIDENT, required: true, index: true },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    default: null,
    index: true,
  },
  status: {
    type: String,
    enum: ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED'],
    default: 'PENDING_VERIFICATION',
    index: true,
  },
  emailVerified: { type: Boolean, default: false },
  mfaEnabled: { type: Boolean, default: false, index: true },
  mfaSecretEncrypted: { type: String, default: null, select: false },
  mfaPendingSecretEncrypted: { type: String, default: null, select: false },
  mfaSetupExpiresAt: { type: Date, default: null, select: false },
  mfaRecoveryCodeHashes: { type: [String], default: [], select: false },
  emailVerificationTokenHash: { type: String, default: null, select: false },
  emailVerificationExpiresAt: { type: Date, default: null, select: false },
  passwordResetTokenHash: { type: String, default: null, select: false },
  passwordResetExpiresAt: { type: Date, default: null, select: false },
  bootstrapKey: { type: String, select: false },
  bootstrapAudit: {
    eventId: { type: String, default: null },
    sourceIpHash: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  tokenVersion: { type: Number, default: 0, select: false },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false, strict: 'throw' })

userSchema.index({ societyId: 1, role: 1, status: 1 })
userSchema.index({ mobileNumber: 1 }, { unique: true, sparse: true })
userSchema.index({ bootstrapKey: 1 }, {
  unique: true,
  partialFilterExpression: { bootstrapKey: { $type: 'string' } },
})
userSchema.pre('save', async function hashPassword() {
  if (this.isModified('passwordHash')) this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
})

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash)
}

export const User = mongoose.model('User', userSchema)