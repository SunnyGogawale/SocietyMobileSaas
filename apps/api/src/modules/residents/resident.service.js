import { residentRepository } from './resident.repository.js'

export const residentService = {
  list(input) {
    return residentRepository.list(input)
  },
  create(input) {
    return residentRepository.create(input)
  },
}