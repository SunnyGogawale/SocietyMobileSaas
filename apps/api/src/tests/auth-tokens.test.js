import { describe, expect, it } from 'vitest'
import { createOneTimeToken, hashOneTimeToken } from '../modules/auth/auth.tokens.js'

describe('single-use authentication tokens', () => {
  it('generates high-entropy tokens and stores only deterministic hashes', () => {
    const first = createOneTimeToken()
    const second = createOneTimeToken()
    expect(first).toHaveLength(43)
    expect(first).not.toBe(second)
    expect(hashOneTimeToken(first)).toHaveLength(64)
    expect(hashOneTimeToken(first)).not.toBe(first)
    expect(hashOneTimeToken(first)).toBe(hashOneTimeToken(first))
  })
})