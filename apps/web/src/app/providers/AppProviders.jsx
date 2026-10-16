import React, { createContext, useContext, useEffect, useState } from 'react'
import { createApiClient } from '@society/api-client'

const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL || '/api/v1',
  clientType: 'web',
})

export const ApiClientContext = createContext(apiClient)
const SessionContext = createContext(null)

export function AppProviders({ children }) {
  return (
    <ApiClientContext.Provider value={apiClient}>
      <SessionProvider>{children}</SessionProvider>
    </ApiClientContext.Provider>
  )
}

function SessionProvider({ children }) {
  const api = useContext(ApiClientContext)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    api.request('/auth/me')
      .then((session) => { if (active) setUser(session.authenticated ? session.user : null) })
      .catch(() => { if (active) setUser(null) })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [api])

  async function refreshSession() {
    const session = await api.request('/auth/me')
    if (!session.authenticated || !session.user) throw new Error('Your session could not be verified.')
    const currentUser = session.user
    setUser(currentUser)
    return currentUser
  }

  async function signOut() {
    try {
      await api.request('/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }

  return (
    <SessionContext.Provider value={{ user, isLoading, refreshSession, signOut }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside AppProviders.')
  return session
}