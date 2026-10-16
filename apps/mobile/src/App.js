import React, { useEffect, useState } from 'react'
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { StatusBar } from 'expo-status-bar'
import { createApiClient } from '@society/api-client'

const tokenKey = 'societyos.access-token'
const refreshTokenKey = 'societyos.refresh-token'
const api = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  credentials: 'omit',
  clientType: 'mobile',
  getAccessToken: () => SecureStore.getItemAsync(tokenKey),
  getRefreshToken: () => SecureStore.getItemAsync(refreshTokenKey),
  onTokens: async ({ accessToken, refreshToken }) => {
    await SecureStore.setItemAsync(tokenKey, accessToken)
    await SecureStore.setItemAsync(refreshTokenKey, refreshToken)
  },
})

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [invitationToken, setInvitationToken] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    api.request('/auth/me').then((session) => {
      if (!active) return
      if (session.authenticated) {
        setUser(session.user)
        return
      }
      return Promise.all([
        SecureStore.deleteItemAsync(tokenKey),
        SecureStore.deleteItemAsync(refreshTokenKey),
      ])
    }).catch((requestError) => {
      if (requestError.status === 401) {
        return Promise.all([
          SecureStore.deleteItemAsync(tokenKey),
          SecureStore.deleteItemAsync(refreshTokenKey),
        ])
      }
      if (active) setError('Unable to check your session. Check your connection and try again.')
      return undefined
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    async function handleAuthLink(url) {
      if (!url) return
      try {
        const params = new URL(url).searchParams
        const verifyToken = params.get('verify')
        const invite = params.get('invite')
        const reset = params.get('reset')
        if (verifyToken) {
          setBusy(true)
          await api.request('/auth/verify-email', { method: 'POST', body: { token: verifyToken } })
          if (active) setNotice('Email verified. You can now sign in.')
          return
        }
        if (invite) {
          setInvitationToken(invite)
          setView('signup')
        } else if (reset) {
          setResetToken(reset)
          setView('reset')
        }
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setBusy(false)
      }
    }
    Linking.getInitialURL().then((url) => handleAuthLink(url))
    const subscription = Linking.addEventListener('url', ({ url }) => handleAuthLink(url))
    return () => {
      active = false
      subscription.remove()
    }
  }, [])

  async function submitAuth() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (view === 'login') {
        const session = await api.request('/auth/login', {
          method: 'POST',
          body: { email, password, clientType: 'mobile', ...(mfaCode ? { mfaCode } : {}) },
        })
        await SecureStore.setItemAsync(tokenKey, session.accessToken)
        await SecureStore.setItemAsync(refreshTokenKey, session.refreshToken)
        setUser(session.user)
        setPassword('')
        setMfaRequired(false)
        setMfaCode('')
      } else if (view === 'signup') {
        if (password !== confirmPassword) throw new Error('Passwords do not match.')
        const result = await api.request('/auth/signup', {
          method: 'POST',
          body: {
            fullName,
            email,
            mobileNumber,
            password,
            confirmPassword,
            ...(invitationToken ? { invitationToken } : {}),
          },
        })
        setNotice(result.message)
      } else if (view === 'forgot') {
        const result = await api.request('/auth/forgot-password', { method: 'POST', body: { email } })
        setNotice(result.message)
      } else if (view === 'reset') {
        if (password !== confirmPassword) throw new Error('Passwords do not match.')
        const result = await api.request('/auth/reset-password', {
          method: 'POST',
          body: { token: resetToken, password, confirmPassword },
        })
        setNotice(result.message)
        setView('login')
        setResetToken('')
        setConfirmPassword('')
      }
    } catch (requestError) {
      if (view === 'login' && requestError.code === 'MFA_REQUIRED') setMfaRequired(true)
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function changeView(nextView) {
    setView(nextView)
    setError('')
    setNotice('')
  }

  async function signOut() {
    try {
      await api.request('/auth/logout', { method: 'POST' })
    } catch {
      setError('Signed out on this device. The server session expires shortly.')
    } finally {
      await SecureStore.deleteItemAsync(tokenKey)
      await SecureStore.deleteItemAsync(refreshTokenKey)
      setUser(null)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.mark}><Text style={styles.markText}>S</Text></View>
          <Text style={styles.brand}>society<Text style={styles.brandLight}>OS</Text></Text>
        </View>
        {user ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>MAPLE GROVE RESIDENCES</Text>
              <Text style={styles.heading}>Hello, {user.fullName.split(' ')[0]}</Text>
              <Text style={styles.heroCopy}>Your community, all in one place.</Text>
            </View>
            <View style={styles.summaryGrid}>
              <Summary label="Maintenance due" value="₹4,500" hint="Due 10 April" />
              <Summary label="Open requests" value="2" hint="1 update today" />
              <Summary label="Visitors today" value="3" hint="1 expected" />
              <Summary label="Bookings" value="1" hint="This weekend" />
            </View>
            <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Quick access</Text><Text style={styles.sectionHint}>YOUR HOME</Text></View>
            <View style={styles.quickList}>
              <QuickLink title="Visitor approval" detail="Let your guests in smoothly" icon="↗" />
              <QuickLink title="Raise a request" detail="Tell us what needs attention" icon="＋" />
              <QuickLink title="Community notices" detail="The latest from Maple Grove" icon="≡" />
            </View>
            <Pressable accessibilityRole="button" onPress={signOut} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Sign out</Text></Pressable>
          </>
        ) : (
          <View style={styles.loginPanel}>
            <Text style={styles.eyebrow}>RESIDENT PORTAL</Text>
            <Text style={styles.heading}>{view === 'login' ? 'Welcome home' : view === 'signup' ? 'Create account' : view === 'forgot' ? 'Reset password' : 'Choose a new password'}</Text>
            <Text style={styles.heroCopy}>{view === 'login' ? 'Sign in to stay connected with your community.' : view === 'signup' ? 'Join your society and stay close to community life.' : view === 'forgot' ? 'We’ll send a reset link if an account matches.' : 'Use a strong password you have not used before.'}</Text>
            {(view === 'login' || view === 'signup') && <View style={styles.modeSwitch}><Pressable accessibilityRole="tab" accessibilityState={{ selected: view === 'login' }} onPress={() => changeView('login')} style={[styles.modeButton, view === 'login' && styles.modeButtonSelected]}><Text style={[styles.modeText, view === 'login' && styles.modeTextSelected]}>Sign in</Text></Pressable><Pressable accessibilityRole="tab" accessibilityState={{ selected: view === 'signup' }} onPress={() => changeView('signup')} style={[styles.modeButton, view === 'signup' && styles.modeButtonSelected]}><Text style={[styles.modeText, view === 'signup' && styles.modeTextSelected]}>Create account</Text></Pressable></View>}
            {invitationToken && view === 'signup' ? <Text style={styles.inviteNote}>Your society invitation is attached to this signup.</Text> : null}
            {view === 'signup' ? <><Text style={styles.label}>Full name</Text><TextInput accessibilityLabel="Full name" autoComplete="name" onChangeText={setFullName} placeholder="Your full name" placeholderTextColor="#89958e" style={styles.input} value={fullName} /><Text style={styles.label}>Mobile number</Text><TextInput accessibilityLabel="Mobile number" autoComplete="tel" keyboardType="phone-pad" onChangeText={setMobileNumber} placeholder="+1 415 555 2671" placeholderTextColor="#89958e" style={styles.input} value={mobileNumber} /></> : null}
            {view !== 'reset' ? <><Text style={styles.label}>Email address</Text><TextInput accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#89958e" style={styles.input} value={email} /></> : null}
            {view === 'login' || view === 'signup' || view === 'reset' ? <><Text style={styles.label}>{view === 'reset' ? 'New password' : 'Password'}</Text><View style={styles.passwordRow}><TextInput accessibilityLabel={view === 'reset' ? 'New password' : 'Password'} autoComplete={view === 'login' ? 'current-password' : 'new-password'} onChangeText={setPassword} placeholder="12+ characters, mixed case and symbol" placeholderTextColor="#89958e" secureTextEntry={!passwordVisible} style={[styles.input, styles.passwordInput]} value={password} /><Pressable accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'} onPress={() => setPasswordVisible(!passwordVisible)} style={styles.passwordToggle}><Text style={styles.passwordToggleText}>{passwordVisible ? 'Hide' : 'Show'}</Text></Pressable></View></> : null}
            {view === 'login' && mfaRequired ? <><Text style={styles.label}>Authenticator or recovery code</Text><TextInput accessibilityLabel="Authenticator code" autoComplete="one-time-code" keyboardType="number-pad" onChangeText={setMfaCode} placeholder="6-digit authenticator code" placeholderTextColor="#89958e" style={styles.input} value={mfaCode} /></> : null}
            {view === 'signup' || view === 'reset' ? <><Text style={styles.label}>Confirm password</Text><TextInput accessibilityLabel="Confirm password" autoComplete="new-password" onChangeText={setConfirmPassword} placeholder="Enter password again" placeholderTextColor="#89958e" secureTextEntry={!passwordVisible} style={styles.input} value={confirmPassword} /><Text style={styles.passwordHint}>12+ characters with uppercase, lowercase, number, and symbol.</Text></> : null}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {notice ? <Text accessibilityRole="alert" style={styles.success}>{notice}</Text> : null}
            <Pressable accessibilityRole="button" disabled={busy || (!email && view !== 'reset') || (view === 'login' && !password) || (view === 'signup' && (!fullName || !mobileNumber || !password || !confirmPassword)) || (view === 'reset' && (!password || !confirmPassword))} onPress={submitAuth} style={[styles.primaryButton, busy && styles.disabledButton]}>
              <Text style={styles.primaryButtonText}>{busy ? 'Please wait…' : view === 'login' ? 'Sign in' : view === 'signup' ? 'Create account' : view === 'forgot' ? 'Send reset link' : 'Save new password'}</Text>
            </Pressable>
            {view === 'login' ? <Pressable accessibilityRole="button" onPress={() => changeView('forgot')} style={styles.textAction}><Text style={styles.textActionText}>Forgot password?</Text></Pressable> : null}
            {view === 'forgot' || view === 'reset' ? <Pressable accessibilityRole="button" onPress={() => changeView('login')} style={styles.textAction}><Text style={styles.textActionText}>Back to sign in</Text></Pressable> : null}
            {view === 'signup' ? <Pressable accessibilityRole="button" onPress={() => changeView('login')} style={styles.textAction}><Text style={styles.textActionText}>Already registered? Sign in</Text></Pressable> : null}
          </View>
        )}
        <Text style={styles.footer}>A little more connected, every day.</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function Summary({ label, value, hint }) {
  return <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryHint}>{hint}</Text></View>
}

function QuickLink({ title, detail, icon }) {
  return <Pressable accessibilityRole="button" style={styles.quickLink}><View style={styles.quickIcon}><Text style={styles.quickIconText}>{icon}</Text></View><View style={styles.quickCopy}><Text style={styles.quickTitle}>{title}</Text><Text style={styles.quickDetail}>{detail}</Text></View><Text style={styles.quickArrow}>›</Text></Pressable>
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#173e35' },
  page: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 30, backgroundColor: '#f3f6f2' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 25 },
  mark: { width: 33, height: 33, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#285d4d' },
  markText: { color: '#d2ebd9', fontSize: 17, fontWeight: '700' },
  brand: { color: '#214338', fontSize: 18, fontWeight: '700' },
  brandLight: { color: '#60927a', fontWeight: '400' },
  hero: { padding: 19, borderRadius: 11, backgroundColor: '#173e35' },
  eyebrow: { color: '#79a990', fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  heading: { marginTop: 8, color: '#233b32', fontSize: 26, fontWeight: '700' },
  heroCopy: { marginTop: 5, color: '#839189', fontSize: 12, lineHeight: 18 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 13 },
  summaryCard: { width: '48%', flexGrow: 1, minHeight: 107, padding: 13, borderWidth: 1, borderColor: '#e4eae3', borderRadius: 9, backgroundColor: '#ffffff' },
  summaryLabel: { color: '#748078', fontSize: 10 },
  summaryValue: { marginTop: 11, color: '#263a31', fontSize: 21, fontWeight: '700' },
  summaryHint: { marginTop: 4, color: '#8d9991', fontSize: 9 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 10 },
  sectionTitle: { color: '#293d34', fontSize: 14, fontWeight: '700' },
  sectionHint: { color: '#87938c', fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  quickList: { overflow: 'hidden', borderWidth: 1, borderColor: '#e4eae3', borderRadius: 9, backgroundColor: '#ffffff' },
  quickLink: { minHeight: 61, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  quickIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#edf5ef' },
  quickIconText: { color: '#3a8068', fontSize: 16, fontWeight: '600' },
  quickCopy: { flex: 1 },
  quickTitle: { color: '#2a3c33', fontSize: 11, fontWeight: '600' },
  quickDetail: { marginTop: 3, color: '#8b968f', fontSize: 9 },
  quickArrow: { color: '#87938c', fontSize: 21 },
  loginPanel: { padding: 20, borderWidth: 1, borderColor: '#e4eae3', borderRadius: 10, backgroundColor: '#ffffff' },
  modeSwitch: { flexDirection: 'row', gap: 4, marginTop: 15, marginBottom: 4, padding: 3, borderRadius: 6, backgroundColor: '#edf1ed' },
  modeButton: { flex: 1, minHeight: 33, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  modeButtonSelected: { backgroundColor: '#ffffff' },
  modeText: { color: '#75837b', fontSize: 10 },
  modeTextSelected: { color: '#2c5141', fontWeight: '700' },
  inviteNote: { marginTop: 12, color: '#52735d', fontSize: 10 },
  label: { marginTop: 17, marginBottom: 6, color: '#526158', fontSize: 10, fontWeight: '600' },
  input: { height: 42, paddingHorizontal: 11, borderWidth: 1, borderColor: '#dfe6df', borderRadius: 6, color: '#273a31', backgroundColor: '#fbfcfb', fontSize: 11 },
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 55 },
  passwordToggle: { position: 'absolute', right: 10, padding: 7 },
  passwordToggleText: { color: '#36755b', fontSize: 10, fontWeight: '700' },
  passwordHint: { marginTop: 6, color: '#87938c', fontSize: 9 },
  error: { marginTop: 10, color: '#a3493e', fontSize: 10 },
  success: { marginTop: 10, color: '#3b7857', fontSize: 10, lineHeight: 16 },
  primaryButton: { height: 43, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderRadius: 6, backgroundColor: '#207663' },
  primaryButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  disabledButton: { opacity: 0.55 },
  secondaryButton: { alignItems: 'center', paddingVertical: 13 },
  secondaryButtonText: { color: '#4b7967', fontSize: 11, fontWeight: '600' },
  textAction: { alignSelf: 'center', paddingTop: 14 },
  textActionText: { color: '#36755b', fontSize: 10, fontWeight: '600' },
  footer: { marginTop: 'auto', paddingTop: 25, color: '#929d95', fontSize: 9, textAlign: 'center' },
})