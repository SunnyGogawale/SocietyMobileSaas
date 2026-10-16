import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ROLES } from '@society/constants'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'
import { ROLE_DASHBOARD_PATH } from './app/router/role-destinations.js'

describe('web application shell', () => {
  it('renders the unified sign-in page when no server session exists', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Sign in' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Create account' })).toBeInTheDocument()
  })

  it('switches between sign-in, signup, and recovery without changing pages', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Welcome back' })

    await user.click(screen.getByRole('tab', { name: 'Create account' }))
    expect(await screen.findByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Mobile number')).toBeRequired()
    expect(screen.getByLabelText('Confirm password')).toBeRequired()

    await user.click(screen.getByRole('tab', { name: 'Sign in' }))
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
    expect(await screen.findByRole('heading', { name: 'Reset your password' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument()
  })

  it('provides an accessible password visibility toggle', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Welcome back' })
    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
  })

  it('defines a dashboard destination for every persisted role', () => {
    expect(Object.keys(ROLE_DASHBOARD_PATH)).toEqual(Object.values(ROLES))
    expect(ROLE_DASHBOARD_PATH[ROLES.SUPER_ADMIN]).toBe('/platform')
    expect(ROLE_DASHBOARD_PATH[ROLES.TENANT]).toBe('/tenant')
  })
})