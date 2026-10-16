import { success } from '../../common/responses/response.js'
import { residentService } from './resident.service.js'

export async function listResidents(request, response) {
  const result = await residentService.list({
    societyId: request.tenant.societyId,
    ...request.validatedQuery,
  })
  return response.json(success(result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: result.pages,
  }))
}

export async function createResident(request, response) {
  const resident = await residentService.create({
    societyId: request.tenant.societyId,
    ...request.body,
  })
  return response.status(201).json(success({
    id: resident._id.toString(),
    fullName: resident.fullName,
    flatId: resident.flatId.toString(),
    occupancyRole: resident.occupancyRole,
    status: resident.status,
  }))
}