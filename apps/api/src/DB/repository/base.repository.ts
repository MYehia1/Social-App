import type {
  AnyKeys,
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
} from 'mongoose'

export interface PaginateOptions<TRawDoc> {
  filter?: QueryFilter<TRawDoc>
  page?: number
  limit?: number
  sort?: Record<string, 1 | -1>
  populate?: PopulateOptions | PopulateOptions[]
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
}

/**
 * A thin, typed data-access layer over a Mongoose model.
 *
 * This started as create-only; the read, update and delete methods every
 * module needs now live here so query construction is not duplicated across
 * services.
 */
export class DatabaseRepository<TRawDoc> {
  constructor(protected readonly model: Model<TRawDoc>) {}

  async create(data: AnyKeys<TRawDoc>): Promise<HydratedDocument<TRawDoc>> {
    const [doc] = await this.model.create([data])
    return doc as HydratedDocument<TRawDoc>
  }

  findOne(
    filter: QueryFilter<TRawDoc>,
    projection?: ProjectionType<TRawDoc>,
    options?: QueryOptions<TRawDoc>,
  ) {
    return this.model.findOne(filter, projection, options)
  }

  findById(id: string, projection?: ProjectionType<TRawDoc>) {
    return this.model.findById(id, projection)
  }

  exists(filter: QueryFilter<TRawDoc>) {
    return this.model.exists(filter)
  }

  updateOne(filter: QueryFilter<TRawDoc>, update: UpdateQuery<TRawDoc>) {
    return this.model.updateOne(filter, update)
  }

  findOneAndUpdate(
    filter: QueryFilter<TRawDoc>,
    update: UpdateQuery<TRawDoc>,
    options: QueryOptions<TRawDoc> = { new: true },
  ) {
    return this.model.findOneAndUpdate(filter, update, options)
  }

  deleteOne(filter: QueryFilter<TRawDoc>) {
    return this.model.deleteOne(filter)
  }

  deleteMany(filter: QueryFilter<TRawDoc>) {
    return this.model.deleteMany(filter)
  }

  countDocuments(filter: QueryFilter<TRawDoc> = {}) {
    return this.model.countDocuments(filter)
  }

  /**
   * Offset pagination. `total` costs an extra count query, which is fine at
   * this scale and lets the client render a real "page N of M".
   */
  async paginate({
    filter = {},
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate,
  }: PaginateOptions<TRawDoc>): Promise<PaginatedResult<HydratedDocument<TRawDoc>>> {
    const safePage = Math.max(1, page)
    const safeLimit = Math.min(Math.max(1, limit), 50)

    let query = this.model
      .find(filter)
      .sort(sort)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)

    if (populate) query = query.populate(populate)

    const [items, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter),
    ])

    const totalPages = Math.ceil(total / safeLimit)

    return {
      items: items as HydratedDocument<TRawDoc>[],
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
    }
  }
}
