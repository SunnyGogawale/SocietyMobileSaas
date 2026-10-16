# Deployment

`infrastructure/docker/compose.yml` is for local development only. It runs MongoDB, Redis, the API, and the built web client. The local database intentionally has no production credentials and must never be exposed to an untrusted network.

For production, build immutable images in CI, inject secrets from a managed secret store, terminate TLS at a trusted load balancer/Nginx, restrict database/Redis networking, configure health-based rollout, and set separate resources/credentials per environment. Use PM2 or an orchestrator only after graceful shutdown and readiness behavior are exercised in the target platform.

The included backup script requires `mongodump`, `MONGODB_URI`, and a protected backup directory. Schedule it externally, encrypt and copy archives to a separate account/region, enforce retention, and perform restore drills. Monitoring currently consists of structured logs and liveness/readiness endpoints; connect these to the deployment platform's metrics and alerting before launch.