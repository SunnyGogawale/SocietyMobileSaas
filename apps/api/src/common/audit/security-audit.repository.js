import { SecurityAudit } from './security-audit.model.js'

export const securityAuditRepository = {
  record(event) {
    return SecurityAudit.create(event)
  },
}