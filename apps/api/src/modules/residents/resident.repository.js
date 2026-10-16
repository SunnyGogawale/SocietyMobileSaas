import { Resident } from './resident.model.js'

export const residentRepository = {
  async list({ societyId, page, limit, status, search }) {
    const filter = { societyId }
    if (status) filter.status = status
    if (search) filter.fullName = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }

    const [items, total] = await Promise.all([
      Resident.find(filter)
        .select('fullName email phone flatId occupancyRole status createdAt')
        .sort({ fullName: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Resident.countDocuments(filter),
    ])

    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  },

  create({ societyId, ...resident }) {
    return Resident.create({ societyId, ...resident })
  },
}