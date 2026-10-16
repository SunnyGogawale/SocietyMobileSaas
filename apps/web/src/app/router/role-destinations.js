import { ROLES } from '@society/constants'

export const ROLE_DASHBOARD_PATH = Object.freeze({
  [ROLES.SUPER_ADMIN]: '/platform',
  [ROLES.SOCIETY_ADMIN]: '/society',
  [ROLES.SOCIETY_MANAGER]: '/management',
  [ROLES.COMMITTEE_MEMBER]: '/committee',
  [ROLES.ACCOUNTANT]: '/accounting',
  [ROLES.SECURITY_GUARD]: '/security',
  [ROLES.MAINTENANCE_STAFF]: '/staff',
  [ROLES.RESIDENT]: '/resident',
  [ROLES.TENANT]: '/tenant',
  [ROLES.VENDOR]: '/vendor',
})