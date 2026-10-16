/** @typedef {'super_admin'|'society_admin'|'society_manager'|'committee_member'|'accountant'|'security_guard'|'maintenance_staff'|'resident'|'tenant'|'vendor'} UserRole */

/**
 * @typedef {object} AuthenticatedUser
 * @property {string} id
 * @property {string} email
 * @property {string} fullName
 * @property {UserRole} role
 * @property {string|null} societyId
 */

/**
 * @typedef {object} PaginatedResult
 * @property {number} page
 * @property {number} limit
 * @property {number} total
 * @property {number} pages
 */

export const sharedTypesVersion = '0.1.0'