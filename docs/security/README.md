# Security Checklist

## Implemented foundations

- Environment parsing with production secret checks.
- Helmet headers, explicit credentialed CORS origins, mutation-origin checks, JSON size limits, and API/auth rate limits.
- HTTP-only, SameSite=Lax web access cookie; mobile sessions return a short-lived bearer token for SecureStore.
- Database-backed token-version checks revoke existing web, mobile, and socket sessions on logout.
- Email verification and password-reset tokens are cryptographically random, hashed at rest, short-lived, and consumed with atomic database updates.
- Public signup rejects role/society fields, defaults to `RESIDENT`, and remains pending until email verification; invitation roles are checked against inviter authority.
- Signup normalizes email/mobile values and relies on unique MongoDB indexes for duplicate prevention.
- Password-reset requests return the same response for known and unknown emails and are rate-limited.
- Password hashing with bcrypt, active-user reload on authenticated requests, permission middleware, and server-derived tenant context.
- Tenant-scoped resident repositories, bounded pagination, and structured-log redaction for cookies and authorization headers.

## Required before production

- Configure unique secrets with a managed secret store; enable HTTPS and secure cookies at the trusted edge.
- Add refresh-token rotation, MFA, account lockout policy, and a reviewed first-admin provisioning flow.
- Add CSRF protection appropriate to the deployed origin topology and verify proxy trust settings.
- Complete authorization and tenant-isolation tests for every module and role.
- Add audit-log persistence, malware/content scanning for uploads, private object storage policies, and signed download URLs.
- Configure production MongoDB authentication, network allowlists, encrypted backups, retention, and tested restore procedures.
- Review `npm audit`, container base images, secrets, dependency licenses, and incident response before every release.

Role-based frontend routes are navigation only, not an authorization boundary; every protected API must enforce permissions server-side. Do not expose local Compose services publicly.