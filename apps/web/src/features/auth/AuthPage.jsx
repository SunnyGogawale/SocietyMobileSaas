import React, { useContext, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Users } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiClientContext, useSession } from '../../app/providers/AppProviders.jsx'
import { ROLE_DASHBOARD_PATH } from '../../app/router/role-destinations.js'
import './AuthPage.css'

const initialForm = { fullName: '', email: '', mobileNumber: '', password: '', confirmPassword: '' }

export default function AuthPage() {
  const api = useContext(ApiClientContext)
  const { refreshSession } = useSession()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const verificationAttempted = useRef('')
  const verificationToken = searchParams.get('verify') ?? ''
  const inviteToken = searchParams.get('invite') ?? ''
  const [resetToken, setResetToken] = useState(searchParams.get('reset') ?? '')
  const [view, setView] = useState(searchParams.has('reset') ? 'reset' : inviteToken ? 'signup' : verificationToken ? 'verify' : 'login')
  const [form, setForm] = useState(initialForm)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!verificationToken || verificationAttempted.current === verificationToken) return
    verificationAttempted.current = verificationToken
    setIsBusy(true)
    api.request('/auth/verify-email', { method: 'POST', body: { token: verificationToken } })
      .then((result) => {
        setNotice({ type: 'success', text: result.message })
        setView('login')
        setSearchParams({}, { replace: true })
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsBusy(false))
  }, [api, setSearchParams, verificationToken])

  function switchView(nextView) {
    setView(nextView)
    setError('')
    setNotice(null)
    setMfaRequired(false)
    if (nextView !== 'reset') {
      setResetToken('')
      if (searchParams.has('reset')) setSearchParams({}, { replace: true })
    }
  }

  function errorText(requestError) {
    const details = requestError.details?.map((detail) => detail.message).filter(Boolean).join(' ')
    return details || requestError.message || 'Something went wrong. Please try again.'
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice(null)
    setIsBusy(true)
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())

    try {
      if (view === 'login') {
        await api.request('/auth/login', {
          method: 'POST',
          body: {
            email: values.email,
            password: values.password,
            clientType: 'web',
            ...(values.mfaCode ? { mfaCode: values.mfaCode } : {}),
          },
        })
        const user = await refreshSession()
        navigate(ROLE_DASHBOARD_PATH[user.role] ?? '/', { replace: true })
        setMfaRequired(false)
      } else if (view === 'signup') {
        const result = await api.request('/auth/signup', {
          method: 'POST',
          body: {
            fullName: values.fullName,
            email: values.email,
            mobileNumber: values.mobileNumber,
            password: values.password,
            confirmPassword: values.confirmPassword,
            ...(inviteToken ? { invitationToken: inviteToken } : {}),
          },
        })
        setNotice({ type: 'success', text: result.message })
        setForm(initialForm)
      } else if (view === 'forgot') {
        const result = await api.request('/auth/forgot-password', {
          method: 'POST',
          body: { email: values.email },
        })
        setNotice({ type: 'success', text: result.message })
      } else if (view === 'reset') {
        const result = await api.request('/auth/reset-password', {
          method: 'POST',
          body: { token: resetToken, password: values.password, confirmPassword: values.confirmPassword },
        })
        setNotice({ type: 'success', text: result.message })
        setView('login')
        setResetToken('')
        setSearchParams({}, { replace: true })
      }
    } catch (requestError) {
      if (view === 'login' && requestError.code === 'MFA_REQUIRED') setMfaRequired(true)
      setError(errorText(requestError))
    } finally {
      setIsBusy(false)
    }
  }

  const title = {
    login: 'Welcome back',
    signup: 'Create your account',
    forgot: 'Reset your password',
    reset: 'Choose a new password',
    verify: 'Verifying your email',
  }[view]
  const subtitle = {
    login: 'Sign in to your society account.',
    signup: 'Join your community on SocietyOS.',
    forgot: 'We’ll email a secure reset link if the account exists.',
    reset: 'Use a strong password you haven’t used before.',
    verify: 'We’re checking your one-time verification link.',
  }[view]

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Link to="/auth" className="auth-brand" aria-label="SocietyOS home">
          <span className="auth-brand-mark"><Building2 size={21} /></span>
          <span>society<span>OS</span></span>
        </Link>
        <div className="auth-aside-content">
          <p className="auth-overline"><span /> MAPLE GROVE RESIDENCES</p>
          <h2>A more connected community starts here.</h2>
          <p className="auth-aside-copy">One place for the people, places, and everyday details that make a society feel like home.</p>
          <div className="auth-community-art" aria-hidden="true">
            <div className="art-tower tower-one"><i /><i /><i /><i /><i /><i /></div>
            <div className="art-tower tower-two"><i /><i /><i /><i /><i /><i /></div>
            <div className="art-tower tower-three"><i /><i /><i /><i /></div>
            <div className="art-ground" />
          </div>
          <div className="auth-aside-footer"><span><ShieldCheck size={15} /> Private by design</span><span>Built for the way communities live</span></div>
        </div>
      </aside>

      <section className="auth-main">
        <div className="auth-mobile-brand"><span className="auth-brand-mark"><Building2 size={19} /></span><strong>society<span>OS</span></strong></div>
        <div className="auth-panel">
          <div className="auth-heading">
            <p className="auth-eyebrow">RESIDENT & TEAM PORTAL</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          {(view === 'login' || view === 'signup') && (
            <div className="auth-switch" role="tablist" aria-label="Authentication view">
              <button role="tab" aria-selected={view === 'login'} className={view === 'login' ? 'selected' : ''} type="button" onClick={() => switchView('login')}>Sign in</button>
              <button role="tab" aria-selected={view === 'signup'} className={view === 'signup' ? 'selected' : ''} type="button" onClick={() => switchView('signup')}>Create account</button>
            </div>
          )}

          {notice && <div className={`auth-notice notice-${notice.type}`} role="status"><CheckCircle2 size={17} /><span>{notice.text}</span></div>}
          {error && <div className="auth-notice notice-error" role="alert"><span className="notice-error-mark">!</span><span>{error}</span></div>}

          {view === 'verify' ? (
            <div className="verification-state" aria-live="polite">
              <span className="verification-icon">{isBusy ? <span className="auth-spinner" /> : <Mail size={23} />}</span>
              <strong>{isBusy ? 'Checking your link' : error ? 'Verification link unavailable' : 'Email verified'}</strong>
              <p>{error || notice?.text || 'Please wait while we verify your address.'}</p>
              {!isBusy && <button className="auth-text-button" type="button" onClick={() => switchView('login')}><ArrowLeft size={15} /> Back to sign in</button>}
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} key={view}>
              {view === 'signup' && (
                <>
                  {inviteToken && <div className="invite-banner"><Users size={16} /> Your society invitation will set your access and community.</div>}
                  <label className="auth-field"><span>Full name</span><input autoComplete="name" name="fullName" placeholder="e.g. Priya Shah" required minLength={2} maxLength={120} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
                  <label className="auth-field"><span>Email address</span><input autoComplete="email" type="email" name="email" placeholder="you@example.com" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
                  <label className="auth-field"><span>Mobile number</span><input autoComplete="tel" type="tel" name="mobileNumber" placeholder="+1 415 555 2671" required pattern="\+[1-9][0-9\s().-]{7,24}" value={form.mobileNumber} onChange={(event) => setForm({ ...form, mobileNumber: event.target.value })} /></label>
                  <PasswordField label="Password" name="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} visible={isPasswordVisible} onToggle={() => setIsPasswordVisible(!isPasswordVisible)} autoComplete="new-password" />
                  <PasswordField label="Confirm password" name="confirmPassword" value={form.confirmPassword} onChange={(value) => setForm({ ...form, confirmPassword: value })} visible={isPasswordVisible} onToggle={() => setIsPasswordVisible(!isPasswordVisible)} autoComplete="new-password" />
                  <p className="password-hint">12+ characters with uppercase, lowercase, number, and symbol.</p>
                </>
              )}

              {(view === 'login' || view === 'forgot') && (
                <label className="auth-field"><span>Email address</span><span className="field-icon"><Mail size={16} /><input autoComplete="email" autoFocus type="email" name="email" placeholder="you@example.com" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></span></label>
              )}

              {(view === 'login' || view === 'reset') && (
                <PasswordField label={view === 'reset' ? 'New password' : 'Password'} name="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} visible={isPasswordVisible} onToggle={() => setIsPasswordVisible(!isPasswordVisible)} autoComplete={view === 'reset' ? 'new-password' : 'current-password'} minLength={view === 'reset' ? 12 : 8} />
              )}

              {view === 'login' && mfaRequired && <label className="auth-field"><span>Authenticator or recovery code</span><input autoComplete="one-time-code" inputMode="numeric" name="mfaCode" placeholder="6-digit code" required minLength={6} maxLength={64} /></label>}

              {view === 'reset' && (
                <>
                  <PasswordField label="Confirm new password" name="confirmPassword" value={form.confirmPassword} onChange={(value) => setForm({ ...form, confirmPassword: value })} visible={isPasswordVisible} onToggle={() => setIsPasswordVisible(!isPasswordVisible)} autoComplete="new-password" minLength={12} />
                  <p className="password-hint">12+ characters with uppercase, lowercase, number, and symbol.</p>
                </>
              )}

              {view === 'login' && <button className="auth-text-button forgot-link" type="button" onClick={() => switchView('forgot')}>Forgot password?</button>}

              <button className="auth-submit" type="submit" disabled={isBusy}>
                {isBusy ? <><span className="auth-spinner spinner-light" />{view === 'login' ? 'Signing in' : view === 'signup' ? 'Creating account' : view === 'reset' ? 'Updating password' : 'Sending instructions'}</> : <>{view === 'login' ? 'Sign in' : view === 'signup' ? 'Create account' : view === 'reset' ? 'Save new password' : 'Send reset link'} <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {(view === 'forgot' || view === 'reset') && <button className="auth-text-button back-link" type="button" onClick={() => switchView('login')}><ArrowLeft size={15} /> Back to sign in</button>}
          {(view === 'login' || view === 'signup') && <p className="auth-legal">By continuing, you agree to your society’s community policies.</p>}
          <div className="auth-secure-note"><LockKeyhole size={13} /> Secure sign-in · SocietyOS</div>
        </div>
        <footer className="auth-main-footer"><span>© {new Date().getFullYear()} SocietyOS</span><span>Need help? Contact your society administrator.</span></footer>
      </section>
    </main>
  )
}

function PasswordField({ label, name, value, onChange, visible, onToggle, autoComplete, minLength = 12 }) {
  const Icon = visible ? EyeOff : Eye
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="password-input-wrap">
        <input autoComplete={autoComplete} type={visible ? 'text' : 'password'} name={name} placeholder="At least 12 characters" required minLength={minLength} maxLength={128} value={value} onChange={(event) => onChange(event.target.value)} />
        <button className="password-visibility" type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={onToggle}><Icon size={17} /></button>
      </span>
    </label>
  )
}