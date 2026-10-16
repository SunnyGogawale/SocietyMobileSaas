# Monitoring

The API emits structured Pino logs and exposes liveness/readiness checks. Forward logs to the deployment platform and alert on readiness failures, repeated 5xx responses, queue failures, and MongoDB/Redis saturation. Metrics export and an error-monitoring provider are intentionally deployment-specific and must be configured before production.