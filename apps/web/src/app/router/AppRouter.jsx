import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders, useSession } from '../providers/AppProviders.jsx'
import { ROLE_DASHBOARD_PATH } from './role-destinations.js'
import Dashboard from '../../features/dashboard/Dashboard.jsx'
import AuthPage from '../../features/auth/AuthPage.jsx'

function SessionLoading() {
  return <main className="auth-loading" aria-live="polite"><span className="auth-spinner" />Checking your session</main>
}

function RoleRedirect() {
  const { user, isLoading } = useSession()
  if (isLoading) return <SessionLoading />
  return <Navigate to={user ? ROLE_DASHBOARD_PATH[user.role] ?? '/auth' : '/auth'} replace />
}

function RoleDashboard({ role }) {
  const { user, isLoading, signOut } = useSession()
  if (isLoading) return <SessionLoading />
  if (!user) return <Navigate to="/auth" replace />
  if (user.role !== role) return <Navigate to={ROLE_DASHBOARD_PATH[user.role] ?? '/auth'} replace />
  return <Dashboard user={user} onLogout={signOut} />
}

export default function AppRouter() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<RoleRedirect />} />
          {Object.entries(ROLE_DASHBOARD_PATH).map(([role, path]) => (
            <Route key={role} path={path} element={<RoleDashboard role={role} />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  )
}