import nodemailer from 'nodemailer'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'

let transport

function getTransport() {
  if (!env.SMTP_HOST || !env.SMTP_FROM) return null
  if (!transport) {
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      ...(env.SMTP_USER && env.SMTP_PASSWORD
        ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
        : {}),
    })
  }
  return transport
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

export async function sendVerificationEmail({ email, fullName, token }) {
  const mailer = getTransport()
  if (!mailer) {
    logger.warn('SMTP is not configured; verification email was not delivered')
    return false
  }

  const link = new URL('/auth', env.AUTH_WEB_URL)
  link.searchParams.set('verify', token)
  const safeName = escapeHtml(fullName)
  try {
    await mailer.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'Verify your SocietyOS email',
      text: `Hello ${fullName}, verify your email within 24 hours: ${link}`,
      html: `<p>Hello ${safeName},</p><p>Verify your email within 24 hours:</p><p><a href="${escapeHtml(link.toString())}">Verify email</a></p>`,
    })
    return true
  } catch (error) {
    logger.error({ err: error }, 'Verification email delivery failed')
    return false
  }
}

export async function sendPasswordResetEmail({ email, fullName, token }) {
  const mailer = getTransport()
  if (!mailer) {
    logger.warn('SMTP is not configured; password reset email was not delivered')
    return false
  }

  const link = new URL('/auth', env.AUTH_WEB_URL)
  link.searchParams.set('reset', token)
  const safeName = escapeHtml(fullName)
  try {
    await mailer.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'Reset your SocietyOS password',
      text: `Hello ${fullName}, reset your password within 30 minutes: ${link}`,
      html: `<p>Hello ${safeName},</p><p>Reset your password within 30 minutes:</p><p><a href="${escapeHtml(link.toString())}">Reset password</a></p>`,
    })
    return true
  } catch (error) {
    logger.error({ err: error }, 'Password reset email delivery failed')
    return false
  }
}

export async function sendInvitationEmail({ email, token }) {
  const mailer = getTransport()
  if (!mailer) {
    logger.warn('SMTP is not configured; society invitation email was not delivered')
    return false
  }

  const link = new URL('/auth', env.AUTH_WEB_URL)
  link.searchParams.set('invite', token)
  try {
    await mailer.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'You are invited to join a SocietyOS community',
      text: `Accept your society invitation within 7 days: ${link}`,
      html: `<p>You have been invited to join a society on SocietyOS.</p><p><a href="${escapeHtml(link.toString())}">Accept invitation</a></p>`,
    })
    return true
  } catch (error) {
    logger.error({ err: error }, 'Invitation email delivery failed')
    return false
  }
}