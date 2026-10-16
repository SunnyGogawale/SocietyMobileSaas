# Database

MongoDB models use timestamps, strict schemas, tenant identifiers, and compound indexes for the access patterns implemented so far. `User.email` is globally unique; user membership across multiple societies needs a dedicated membership model before that product requirement is enabled.

Residents are indexed by `{ societyId, flatId, status }` and `{ societyId, email }`. Queries use a required society ID from authenticated context, validate page/limit, cap page size at 100, and select only list fields.

Before adding financial modules, define money as integer minor units with an explicit currency, use MongoDB transactions for ledger/payment updates, make provider callbacks idempotent, and add migration/backfill plans. Production transactions require a MongoDB replica set or Atlas deployment.