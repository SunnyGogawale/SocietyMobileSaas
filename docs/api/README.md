# API

All application routes are versioned under `/api/v1`. OpenAPI UI is served at `/api/docs`; machine-readable OpenAPI JSON is maintained in `apps/api/src/docs/openapi.js`.

## Initial endpoints

- `GET /api/v1/health/live`: process liveness.
- `GET /api/v1/health/ready`: readiness, including MongoDB connectivity.
- `POST /api/v1/auth/login`: web cookie or mobile bearer-token session.
- `POST /api/v1/auth/signup`: create a pending resident account; role/society fields are rejected.
- `POST /api/v1/auth/verify-email`: consume a single-use email-verification token.
- `POST /api/v1/auth/forgot-password`: send a reset link with an enumeration-safe response.
- `POST /api/v1/auth/reset-password`: consume a hashed, short-lived token and revoke existing sessions.
- `POST /api/v1/auth/logout`: revoke sessions and clear the web cookie.
- `GET /api/v1/auth/me`: current active account.
- `POST /api/v1/auth/invitations`: authenticated society invitation; role and society are server-scoped.
- `GET /api/v1/residents`: tenant-scoped, permission-checked, paginated resident list.
- `POST /api/v1/residents`: create a resident in the authenticated society.

Errors use `{ error: { code, message, details?, requestId } }`; successful responses use `{ data, meta? }`.

The API has no public privileged-account registration or account-seeding endpoint. Provision the first platform administrator through a reviewed, one-time operational script before enabling sign-in. SMTP must be configured for verification, reset, and invitation delivery.