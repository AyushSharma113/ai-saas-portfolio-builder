import Template, { TemplateDocument } from "@/models/Template";
import { BaseRepository } from "./BaseRepository";
import { QueryFilter } from "mongoose";

// What’s happening:

// Calls the parent BaseRepository constructor
// Passes the Template model
// This lets the base class know which Mongoose model it should operate on

export class TemplateRepositoryClass extends BaseRepository<TemplateDocument> {
  constructor() {
    super(Template)
  }

 /**
   * Finds all templates with advanced filtering and pagination
   */
   async findAllWithFilters(
    filters: QueryFilter<TemplateDocument> = {}
  ): Promise<{
    data: TemplateDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // await connectDB();

    // Build query
    const query: QueryFilter<TemplateDocument> = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.premium !== undefined) {
      query.premium = filters.premium;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.createdBy) {
      query.createdBy = filters.createdBy;
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    return await this.findWithPagination(query, filters.page, filters.limit);
  }

  

  // **
  //  * Duplicate an existing template
  //  *
  //  * Creates a copy of the specified template with:
  //  * - Modified title (adds "Copy" suffix)
  //  * - New creator ID
  //  * - Inactive status by default
  //  * - New timestamps
  //  *
  //  * @param templateId - ID of the template to duplicate
  //  * @param createdBy - User ID who is creating the duplicate
  //  * @returns Promise with the duplicated template or null if failed
  //  */
  async duplicateTemplate(templateId: string): Promise<TemplateDocument | null>{
      // await connectDB();

      // Find the original template
      // .lean() - return a plain js object and faster
      //  and prevents accidental mutation of mongoose documents
      const originalTemplate = await Template.findById(templateId).lean();
      if(!originalTemplate){
        return null
      }

       // Generate unique title for the duplicate
      let duplicateTitle = `${originalTemplate.title} (Copy)`;
      let counter = 1;

      // Ensure title uniqueness by checking existing templates
      while (await Template.findOne({ title: duplicateTitle })) {
        counter++;
        duplicateTitle = `${originalTemplate.title} (Copy ${counter})`;
      }

         // Create new template document with modified data
      const duplicatedTemplate = new Template({
      title: duplicateTitle,
      description: originalTemplate.description,
      primaryColor: originalTemplate.primaryColor,
      secondaryColor: originalTemplate.secondaryColor,
      font: originalTemplate.font,
      thumbnail: originalTemplate.thumbnail,
      premium: originalTemplate.premium,
      tags: originalTemplate.tags,
      status: "inactive",
    });


      // Save the duplicated template to database
      await duplicatedTemplate.save();
      return duplicatedTemplate;
  
  }

  
  
  
  
}


