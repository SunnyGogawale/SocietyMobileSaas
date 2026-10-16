export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function createApiClient({
  baseUrl,
  getAccessToken = async () => null,
  getRefreshToken = async () => null,
  onTokens = async () => {},
  clientType = 'web',
  fetchImpl = globalThis.fetch,
  credentials = 'include',
}) {
  if (!baseUrl) throw new Error('An API base URL is required.')
  if (typeof fetchImpl !== 'function') throw new Error('A Fetch API implementation is required.')

  const root = baseUrl.replace(/\/$/, '')
  let refreshInFlight = null

  async function refreshSession() {
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        const refreshToken = clientType === 'mobile' ? await getRefreshToken() : null
        const response = await fetchImpl(`${root}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials,
          body: JSON.stringify({ clientType, ...(refreshToken ? { refreshToken } : {}) }),
        })
        if (!response.ok) return false
        const payload = await response.json().catch(() => null)
        const tokens = payload?.data
        if (clientType === 'mobile' && (!tokens?.accessToken || !tokens?.refreshToken)) return false
        await onTokens(tokens ?? {})
        return true
      })().finally(() => { refreshInFlight = null })
    }
    return refreshInFlight
  }

  async function send(path, options) {
    const token = await getAccessToken()
    const headers = new Headers(options.headers)
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
    if (options.body && !isFormData) headers.set('Content-Type', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return fetchImpl(`${root}${path.startsWith('/') ? path : `/${path}`}`, {
      ...options,
      headers,
      credentials,
      body: options.body && typeof options.body !== 'string' && !isFormData
        ? JSON.stringify(options.body)
        : options.body,
    })
  }

  return {
    async request(path, options = {}) {
      let response = await send(path, options)
      if (response.status === 401 && !options.skipAuthRefresh && path !== '/auth/login' && path !== '/auth/refresh') {
        if (await refreshSession()) response = await send(path, options)
      }

      const payload = response.status === 204 ? null : await response.json().catch(() => null)
      if (!response.ok) {
        throw new ApiError(payload?.error?.message ?? 'The request could not be completed.', {
          status: response.status,
          code: payload?.error?.code,
          details: payload?.error?.details,
        })
      }
      return payload?.data ?? payload
    },
  }
}