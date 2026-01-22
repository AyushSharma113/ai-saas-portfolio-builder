import Portfolio, { PortfolioDocument } from "@/models/Portfolio";
import { BaseRepository } from "./BaseRepository";
import { PortfolioFilters, PortfolioResponse } from "@/types/portfolio";
import { QueryFilter } from "mongoose";


export class PortfolioRepositoryClass extends BaseRepository<PortfolioDocument>{
    constructor(){
    // Pass the User Mongoose model to the base repository
    super(Portfolio);
  }



  /**
   * Find portfolio by slug (for public viewing)
   */  

  async findBySlug(slug: string): Promise<PortfolioDocument | null>{
    try {
        const portfolio = await Portfolio.findOne({slug}).populate("templateId")
        return portfolio;
    } catch (error) {
        throw new Error(`failed to load portfolio by the slug: ${
            error instanceof Error ? error.message : "unknown error"}`)
    }
  }
  
  
  /**
   * Find portfolio by the user id with filter
   */  
  async findByUserId(userId: string, filters: PortfolioFilters = {}): Promise<PortfolioResponse>{
      try {
        const {
        status,
        templateId,
        search,
        sortBy = "updatedAt",
        sortOrder = "desc",
        page = 1,
        limit = 10,} = filters;

        const query: QueryFilter<PortfolioDocument> = {userId};
        if(status) {
          query.status = status
        }
         if (templateId) {
        query.templateId = templateId;
      }
      // "Find any document where the search term appears in at least one of these four specific fields."
         if (search) {
        query.$or = [
          { "profile.name": { $regex: search, $options: "i" } },
          { "profile.title": { $regex: search, $options: "i" } },
          { "profile.bio": { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
        ];
      }

      // get total count 
      const total = await Portfolio.countDocuments(query);

      //Build sort query
      const sort: Record<string, 1 | -1> = {} 
      // It uses Square Bracket Notation (sort["profile.name"]) because standard dot notation (sort.profile.name)
      //  doesn't work well when you're trying to set a dynamic key that contains a literal dot.
       if (sortBy === "name") {
        sort["profile.name"] = sortOrder === "asc" ? 1 : -1;
      } else {
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
      }
        


         // Execute query with pagination
      const skip = (page - 1) * limit;
      


      const portfolios = await Portfolio.aggregate([
        { $match: query }, // your query
        {
          $lookup: {
            from: "templates",
            localField: "templateId",
            foreignField: "_id",
            as: "templateId",
          },
        },
        { $unwind: "$templateId" },
        {
          $lookup: {
            from: "portfolioanalytics", // ⚠️ must be the lowercase collection name
            localField: "_id",
            foreignField: "portfolioId",
            as: "views",
          },
        },
        {
          $addFields: {
            viewCount: { $size: "$views" },
          },
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);

        return {
        portfolios,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
      
      } catch (error) {
         throw new Error(
        `Failed to find portfolios by user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      }
  }
}



