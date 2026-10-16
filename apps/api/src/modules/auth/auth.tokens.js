import { createHash, randomBytes } from 'node:crypto'

export function createOneTimeToken() {
  return randomBytes(32).toString('base64url')
}

export function hashOneTimeToken(token) {
  return createHash('sha256').update(token).digest('hex')
}