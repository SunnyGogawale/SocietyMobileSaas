import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'
import { authService } from '../modules/auth/auth.service.js'

const app = createApp()

describe('API foundation', () => {
  it('reports liveness without requiring external services', async () => {
    const response = await request(app).get('/api/v1/health/live')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  it('rejects invalid login input before reaching persistence', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({ email: 'not-an-email' })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects public signup attempts to assign a privileged role', async () => {
    const response = await request(app).post('/api/v1/auth/signup').send({
      fullName: 'Taylor Resident',
      email: 'taylor@example.com',
      mobileNumber: '+14155552671',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
      role: 'SUPER_ADMIN',
    })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('validates forgot-password input before querying accounts', async () => {
    const response = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'invalid' })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns the same forgot-password response for every email address', async () => {
    const resetSpy = vi.spyOn(authService, 'requestPasswordReset').mockResolvedValue(undefined)
    const known = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'known@example.com' })
    const unknown = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'unknown@example.com' })
    expect(known.status).toBe(200)
    expect(unknown.status).toBe(200)
    expect(known.body).toEqual(unknown.body)
    expect(resetSpy).toHaveBeenNthCalledWith(1, { email: 'known@example.com' })
    resetSpy.mockRestore()
  })

  it('requires matching strong passwords for reset', async () => {
    const response = await request(app).post('/api/v1/auth/reset-password').send({
      token: 'a'.repeat(43),
      password: 'StrongPassword123!',
      confirmPassword: 'DifferentPassword123!',
    })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('requires authentication for resident data', async () => {
    const response = await request(app).get('/api/v1/residents')
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHENTICATED')
  })

  it('requires an authenticated session to revoke sessions', async () => {
    const response = await request(app).post('/api/v1/auth/logout')
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHENTICATED')
  })
})