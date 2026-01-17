import type { Model, Document, QueryFilter, QueryOptions, UpdateQuery } from "mongoose";


/**
 * Generic base repository class to encapsulate common
 * database operations for Mongoose models.
 *
 * @template T - Mongoose Document type
 */
// An Abstract Class is a "half-finished" blueprint. You cannot create an object directly from it (using new); it only exists to be inherited by others.

//T can be any type, BUT it must be a Mongoose Document.
export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  /**
   * Creates a new BaseRepository instance for a given Mongoose model.
   * @param model - The Mongoose model to operate on.
   */


  constructor(model:Model<T>){
    this.model = model
  }
  
   /**
   * Creates and saves a new document in the database.
   * @param data - Partial document data to create.
   * @returns The created document.
   */
  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data); //this creates a new MongoDB document object in memory.
    return await document.save();
  }

  
 /**
   * Finds a document by its MongoDB ObjectId.
   * @param id - Document ID.
   * @returns The found document or null if not found.
   */
  async findById(id: string): Promise<T | null> {
    // .exec() converts mongoose query into real promise
    return await this.model.findById(id).exec()
  }

  
  /**
   * Finds the first document matching the provided filter.
   * @param filter - MongoDB filter query.
   * @returns The found document or null.
   */
  async findOne(filter: QueryFilter<T>): Promise<T | null> {
    return await this.model.findOne(filter).exec();
  }

  
  /**
   * Finds all documents matching the filter with optional query options.
   * @param filter - MongoDB filter query (default: {} to find all).
   * @param options - Mongoose query options (optional).
   * @returns An array of matching documents.
   */
  async find(
    filter: QueryFilter<T> = {},
    options?: QueryOptions
  ): Promise<T[]> {
    return await this.model.find(filter, null, options).exec();
  }


 async findWithPagination(
    filter: QueryFilter<T> = {},
    page = 1,
    limit = 10,
    sort: QueryFilter<{ createdAt: string }> = { createdAt: -1 }
  ): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    // Run queries in parallel: fetch paginated data and count total documents
    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Updates a document by its ID.
   * @param id - Document ID.
   * @param data - Partial data to update.
   * @returns The updated document or null if not found.
   */
  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  /**
   * Updates the first document matching the filter.
   * @param filter - MongoDB filter query.
   * @param data - Partial data to update.
   * @returns The updated document or null if not found.
   */
  async updateOne(
    filter: QueryFilter<T>,
    data: UpdateQuery<T>
  ): Promise<T | null> {
    return await this.model
      .findOneAndUpdate(filter, data, { new: true })
      .exec();
  }

  /**
   * Deletes a document by its ID.
   * @param id - Document ID.
   * @returns The deleted document or null if not found.
   */
  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }

  /**
   * Deletes multiple documents matching the filter.
   * @param filter - MongoDB filter query.
   * @returns An object containing the number of documents deleted.
   */
  async deleteMany(filter: QueryFilter<T>): Promise<{ deletedCount: number }> {
    const result = await this.model.deleteMany(filter).exec();
    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * Counts the number of documents matching the filter.
   * @param filter - MongoDB filter query (default: {}).
   * @returns The number of matching documents.
   */
  async count(filter: QueryFilter<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }

  /**
   * Checks if a document exists matching the filter.
   * @param filter - MongoDB filter query.
   * @returns True if at least one document exists, false otherwise.
   */
  async exists(filter: QueryFilter<T>): Promise<boolean> {
    const doc = await this.model.findOne(filter).select("_id").exec();
    return !!doc;
  }
  
}
