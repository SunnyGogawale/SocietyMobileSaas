import { User } from './user.model.js'

export const userRepository = {
  findForAuthentication(email) {
    return User.findOne({ email }).select('+passwordHash +tokenVersion +mfaEnabled +mfaSecretEncrypted +mfaRecoveryCodeHashes')
  },
  findActiveById(id) {
    return User.findOne({ _id: id, status: 'ACTIVE' }).select('_id email fullName role societyId status tokenVersion')
  },
  findMfaState(id) {
    return User.findOne({ _id: id, status: 'ACTIVE' }).select(
      '_id email fullName role societyId status tokenVersion mfaEnabled +passwordHash +mfaSecretEncrypted +mfaPendingSecretEncrypted +mfaSetupExpiresAt +mfaRecoveryCodeHashes',
    )
  },
  setMfaSetup(id, encryptedSecret, expiresAt) {
    return User.updateOne({ _id: id, status: 'ACTIVE', mfaEnabled: false }, {
      $set: { mfaPendingSecretEncrypted: encryptedSecret, mfaSetupExpiresAt: expiresAt },
    })
  },
  enableMfa({ id, pendingSecret, encryptedSecret, recoveryCodeHashes, now }) {
    return User.updateOne({
      _id: id,
      status: 'ACTIVE',
      mfaEnabled: false,
      mfaPendingSecretEncrypted: pendingSecret,
      mfaSetupExpiresAt: { $gt: now },
    }, {
      $set: {
        mfaEnabled: true,
        mfaSecretEncrypted: encryptedSecret,
        mfaPendingSecretEncrypted: null,
        mfaSetupExpiresAt: null,
        mfaRecoveryCodeHashes: recoveryCodeHashes,
      },
    })
  },
  consumeMfaRecoveryCode(id, codeHash) {
    return User.updateOne({ _id: id, mfaRecoveryCodeHashes: codeHash }, {
      $pull: { mfaRecoveryCodeHashes: codeHash },
    })
  },
  disableMfa(id) {
    return User.updateOne({ _id: id, status: 'ACTIVE', mfaEnabled: true }, {
      $set: {
        mfaEnabled: false,
        mfaSecretEncrypted: null,
        mfaPendingSecretEncrypted: null,
        mfaSetupExpiresAt: null,
        mfaRecoveryCodeHashes: [],
      },
      $inc: { tokenVersion: 1 },
    })
  },
  findBootstrapAdmin() {
    return User.findOne({ bootstrapKey: 'initial-super-admin-v1' }).select('_id email')
  },
  findByEmail(email) {
    return User.findOne({ email }).select('_id email fullName status emailVerified')
  },
  create(input) {
    return User.create(input)
  },
  setEmailVerificationToken(userId, tokenHash, expiresAt) {
    return User.updateOne({ _id: userId, status: 'PENDING_VERIFICATION' }, {
      $set: { emailVerificationTokenHash: tokenHash, emailVerificationExpiresAt: expiresAt },
    })
  },
  consumeEmailVerificationToken(tokenHash, now) {
    return User.findOneAndUpdate({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: now },
      status: 'PENDING_VERIFICATION',
    }, {
      $set: {
        emailVerified: true,
        status: 'ACTIVE',
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    }, { new: true }).select('_id email fullName role societyId status')
  },
  setPasswordResetToken(email, tokenHash, expiresAt) {
    return User.updateOne({ email, status: { $ne: 'SUSPENDED' } }, {
      $set: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
    })
  },
  consumePasswordResetToken(tokenHash, passwordHash, now) {
    return User.findOneAndUpdate({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: now },
      status: { $ne: 'SUSPENDED' },
    }, {
      $set: { passwordHash, passwordResetTokenHash: null, passwordResetExpiresAt: null },
      $inc: { tokenVersion: 1 },
    }, { new: true }).select('_id email')
  },
  deleteById(id) {
    return User.deleteOne({ _id: id })
  },
  updateLastLogin(id, timestamp) {
    return User.updateOne({ _id: id }, { $set: { lastLoginAt: timestamp } })
  },
  revokeSessions(id) {
    return User.updateOne({ _id: id }, { $inc: { tokenVersion: 1 } })
  },
}