import { z } from 'zod'
import { ROLES } from '@society/constants'

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  clientType: z.enum(['web', 'mobile']).default('web'),
  mfaCode: z.string().trim().min(6).max(64).optional(),
}).strict()

export const mfaCodeSchema = z.object({
  code: z.string().trim().min(6).max(64),
}).strict()

export const mfaDisableSchema = z.object({
  password: z.string().min(8).max(128),
  code: z.string().trim().min(6).max(64),
}).strict()

export const refreshSchema = z.object({
  clientType: z.enum(['web', 'mobile']).default('web'),
  refreshToken: z.string().min(32).max(128).optional(),
}).strict()

export const passwordSchema = z.string()
  .min(12, 'Use at least 12 characters.')
  .max(128, 'Password must be 128 characters or fewer.')
  .regex(/[a-z]/, 'Add a lowercase letter.')
  .regex(/[A-Z]/, 'Add an uppercase letter.')
  .regex(/\d/, 'Add a number.')
  .regex(/[^A-Za-z0-9]/, 'Add a symbol.')

export const superAdminBootstrapSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  mobileNumber: z.string().trim().min(8).max(32)
    .transform((value) => value.replace(/[\s().-]/g, ''))
    .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/))
    .optional(),
  password: passwordSchema,
}).strict()

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  mobileNumber: z.string().trim().min(8).max(32)
    .transform((value) => value.replace(/[\s().-]/g, ''))
    .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, 'Use international format, for example +14155552671.')),
  password: passwordSchema,
  confirmPassword: z.string().min(1),
  invitationToken: z.string().min(32).max(128).optional(),
}).strict().refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
}).strict()

export const verifyEmailSchema = z.object({
  token: z.string().min(32).max(128),
}).strict()

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: passwordSchema,
  confirmPassword: z.string().min(1),
}).strict().refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
})

export const invitationCreateSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  role: z.enum([
    ROLES.SOCIETY_MANAGER,
    ROLES.COMMITTEE_MEMBER,
    ROLES.ACCOUNTANT,
    ROLES.SECURITY_GUARD,
    ROLES.MAINTENANCE_STAFF,
    ROLES.RESIDENT,
    ROLES.TENANT,
    ROLES.VENDOR,
  ]),
}).strict()

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

export const residentCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
  phone: z.string().trim().min(7).max(24).optional(),
  flatId: z.string().regex(/^[\da-f]{24}$/i),
  occupancyRole: z.enum(['owner', 'tenant', 'family_member']),
}).strict()

export const residentListQuerySchema = paginationSchema.extend({
  status: z.enum(['active', 'pending', 'moved_out']).optional(),
  search: z.string().trim().max(100).optional(),
}).strict()