import mongoose from 'mongoose'

const securityAuditSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  action: { type: String, required: true, index: true },
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sourceIpHash: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true, versionKey: false, strict: 'throw' })

securityAuditSchema.index({ action: 1, createdAt: -1 })

export const SecurityAudit = mongoose.model('SecurityAudit', securityAuditSchema)