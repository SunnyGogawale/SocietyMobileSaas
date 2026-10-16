import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { env } from '../../config/env.js'

export function encryptSensitive(plaintext) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', env.SENSITIVE_DATA_ENCRYPTION_KEY, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`
}

export function decryptSensitive(payload) {
  const [version, ivPart, tagPart, ciphertextPart] = payload.split('.')
  if (version !== 'v1' || !ivPart || !tagPart || !ciphertextPart) throw new Error('Encrypted payload format is invalid.')
  const decipher = createDecipheriv('aes-256-gcm', env.SENSITIVE_DATA_ENCRYPTION_KEY, Buffer.from(ivPart, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}