import mongoose from 'mongoose'
import { ROLES } from '@society/constants'

const invitationSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  tokenHash: { type: String, required: true, unique: true, select: false },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  role: {
    type: String,
    enum: [
      ROLES.SOCIETY_MANAGER,
      ROLES.COMMITTEE_MEMBER,
      ROLES.ACCOUNTANT,
      ROLES.SECURITY_GUARD,
      ROLES.MAINTENANCE_STAFF,
      ROLES.RESIDENT,
      ROLES.TENANT,
      ROLES.VENDOR,
    ],
    required: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false, strict: 'throw' })

invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
invitationSchema.index({ societyId: 1, email: 1, acceptedAt: 1 })

export const Invitation = mongoose.model('Invitation', invitationSchema)