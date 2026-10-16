import { Router } from 'express'
import {
	mfaCodeSchema,
	mfaDisableSchema,
	forgotPasswordSchema,
	invitationCreateSchema,
	loginSchema,
	refreshSchema,
	resetPasswordSchema,
	signupSchema,
	superAdminBootstrapSchema,
	verifyEmailSchema,
} from '@society/validation'
import { PERMISSIONS } from '@society/constants'
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { attachTenantContext, requireTenant } from '../../middleware/tenant-context.js'
import { authRateLimiter, bootstrapRateLimiter, passwordResetRateLimiter } from '../../middleware/rate-limiter.js'
import { validateRequest } from '../../middleware/validate-request.js'
import {
	createInvitation,
	currentSession,
	bootstrapSuperAdmin,
	forgotPassword,
	login,
	logout,
	resetPassword,
	refresh,
	signup,
	verifyEmail,
	setupMfa,
	enableMfa,
	disableMfa,
} from './auth.controller.js'

export const authRoutes = Router()

authRoutes.post('/login', authRateLimiter, validateRequest(loginSchema), login)
authRoutes.post('/refresh', authRateLimiter, validateRequest(refreshSchema), refresh)
authRoutes.post('/mfa/setup', authenticate, setupMfa)
authRoutes.post('/mfa/enable', authenticate, validateRequest(mfaCodeSchema), enableMfa)
authRoutes.post('/mfa/disable', authenticate, validateRequest(mfaDisableSchema), disableMfa)
authRoutes.post('/signup', authRateLimiter, validateRequest(signupSchema), signup)
authRoutes.post('/bootstrap/super-admin', bootstrapRateLimiter, validateRequest(superAdminBootstrapSchema), bootstrapSuperAdmin)
authRoutes.post('/verify-email', passwordResetRateLimiter, validateRequest(verifyEmailSchema), verifyEmail)
authRoutes.post('/forgot-password', passwordResetRateLimiter, validateRequest(forgotPasswordSchema), forgotPassword)
authRoutes.post('/reset-password', passwordResetRateLimiter, validateRequest(resetPasswordSchema), resetPassword)
authRoutes.post('/logout', authenticate, logout)
authRoutes.get('/me', optionalAuthenticate, currentSession)
authRoutes.post(
	'/invitations',
	authenticate,
	attachTenantContext,
	requireTenant,
	authorize(PERMISSIONS.INVITATIONS_WRITE),
	validateRequest(invitationCreateSchema),
	createInvitation,
)