import { Invitation } from './invitation.model.js'

export const invitationRepository = {
  create(input) {
    return Invitation.create(input)
  },
  findUsable({ email, tokenHash, now }) {
    return Invitation.findOne({ email, tokenHash, acceptedAt: null, expiresAt: { $gt: now } })
      .select('+tokenHash')
  },
  consume(id, now) {
    return Invitation.updateOne({ _id: id, acceptedAt: null, expiresAt: { $gt: now } }, {
      $set: { acceptedAt: now },
    })
  },
  deleteById(id) {
    return Invitation.deleteOne({ _id: id })
  },
}