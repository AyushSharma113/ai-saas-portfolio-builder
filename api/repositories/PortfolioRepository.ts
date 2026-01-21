import Portfolio, { PortfolioDocument } from "@/models/Portfolio";
import { BaseRepository } from "./BaseRepository";


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
  async findByUserId()
}



