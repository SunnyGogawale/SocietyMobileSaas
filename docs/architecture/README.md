# Architecture

## Workspace boundaries

`apps/web`, `apps/mobile`, and `apps/api` are deployable clients/services. `packages/*` contains dependency-light contracts that may be imported by multiple apps. Dependencies flow from apps to packages; packages never import application code.

## API request flow

```text
HTTP -> security / request logging -> versioned route -> authenticate -> authorize -> tenant context -> validate -> controller -> service -> repository -> MongoDB
```

Authentication reloads the active user from MongoDB after token verification. Tenant context is taken from that database user record, never from a query parameter, body, or header. Platform administrators are rejected from tenant-required routes unless a route explicitly implements a platform operation.

## Feature modules

The auth and resident modules establish the intended pattern. Add other domains as vertical slices under `apps/api/src/modules/<domain>` with model, routes, controller, service, repository, validation, permissions, mapper, and tests as needed. Keep cross-cutting concerns in middleware/config/common, not inside feature modules.

## Shared contracts

- `packages/constants`: canonical role and permission identifiers.
- `packages/shared-types`: JavaScript JSDoc typedefs for editor support.
- `packages/validation`: Zod request contracts used at the API boundary and by clients.
- `packages/api-client`: Fetch wrapper; web uses HTTP-only cookies, mobile injects a SecureStore token provider.

## Data and operations

Society-owned models carry an indexed `societyId`. Repository functions require tenant scope explicitly. List endpoints must validate bounded pagination and filters. Financial writes should use MongoDB sessions/transactions when the accounting/payment modules are implemented. BullMQ jobs must be idempotent and carry tenant identifiers; Socket.IO rooms are derived from the authenticated database user.

## Current implementation boundary

This repository is a production-oriented foundation, not a finished production service. Only authentication primitives, health checks, and a resident slice are implemented in the API. Payment providers, refresh/session lifecycle, full module coverage, audit persistence, observability export, and operational recovery drills remain release gates.