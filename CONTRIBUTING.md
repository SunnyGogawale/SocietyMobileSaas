# Contributing

## Local workflow

Use Node.js 22.12+ and npm 10.9+. Install once from the repository root with `npm install`. Keep packages within their workspace and import shared behavior through `@society/*` package exports.

Before submitting changes, run:

```sh
npm run lint
npm test
npm run build
```

## Module boundaries

- Route files compose middleware and map HTTP methods to controllers.
- Controllers translate HTTP requests/responses and do not issue database queries.
- Services own business rules and orchestration.
- Repositories own persistence queries and must require tenant scope for society-owned records.
- Validation schemas are shared from `packages/validation` where client/server contracts match.
- Shared packages must not import from `apps/*`.

## Security review

Never accept a society identifier from an untrusted request as authorization context. Add tests for tenant boundaries and permission denials with every new protected route. Do not commit `.env` files, access tokens, private certificates, production data, or generated uploads.