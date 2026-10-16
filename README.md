# Society Management SaaS

Multi-tenant society operations platform organized as an npm workspaces monorepo. The repository includes a React web client, Express API foundation, shared JavaScript packages, and an Expo mobile shell.

## Requirements

- Node.js 22.12 or newer
- npm 10.9 or newer
- Docker Desktop for local MongoDB and Redis

## Getting started

1. Install workspace dependencies with `npm install`.
2. Copy `apps/api/.env.example` to `apps/api/.env`, set a unique local JWT secret, and configure SMTP to deliver verification/reset links.
3. Start infrastructure with `docker compose -f infrastructure/docker/compose.yml up -d`.
4. Start web and API with `npm run dev`.
5. Open `http://localhost:5173`; the API is on `http://localhost:4000` and OpenAPI UI is at `/api/docs`.

Run the mobile client with `npm run start --workspace @society/mobile` and Expo Go or a simulator.

## Workspaces

- `apps/web`: React, Vite, router, and society operations dashboard.
- `apps/mobile`: Expo / React Native resident shell using SecureStore for mobile tokens.
- `apps/api`: Express, Mongoose, authentication, tenant middleware, queues, sockets, and health checks.
- `packages/shared-types`: JavaScript JSDoc contracts.
- `packages/validation`: shared Zod schemas.
- `packages/api-client`: credentialed Fetch client.
- `packages/constants`: roles, permissions, and API constants.
- `packages/config`: shared formatting configuration.
- `infrastructure`: local Compose, Nginx, monitoring, and backup examples.
- `docs`: architecture, API, database, deployment, and security decisions.

## Checks

- `npm run lint`
- `npm test`
- `npm run build`

## Security boundary

Dashboard access is session-gated and role-derived. Public signup always creates a pending `RESIDENT`; only an authenticated society invitation can set its society and a permitted non-platform role. Server authorization and tenant scope are enforced by API middleware; never trust a client-provided society ID. Provision the first `SUPER_ADMIN` through a reviewed operational script. This is a production-oriented foundation, not a complete production service. Review `docs/security/README.md` and `docs/architecture/README.md` for remaining release gates.
