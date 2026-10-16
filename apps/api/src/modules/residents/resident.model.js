import mongoose from 'mongoose'

const residentSchema = new mongoose.Schema({
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 24 },
  occupancyRole: { type: String, enum: ['owner', 'tenant', 'family_member'], required: true },
  status: { type: String, enum: ['active', 'pending', 'moved_out'], default: 'pending' },
}, { timestamps: true, strict: 'throw' })

residentSchema.index({ societyId: 1, flatId: 1, status: 1 })
residentSchema.index({ societyId: 1, email: 1 }, { sparse: true })

export const Resident = mongoose.model('Resident', residentSchema)