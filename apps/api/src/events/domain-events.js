import { EventEmitter } from 'node:events'

export const domainEvents = new EventEmitter()
domainEvents.setMaxListeners(50)

export const DOMAIN_EVENTS = Object.freeze({
  RESIDENT_CREATED: 'resident.created',
  COMPLAINT_CREATED: 'complaint.created',
  PAYMENT_RECORDED: 'payment.recorded',
})