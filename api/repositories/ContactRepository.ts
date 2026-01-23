import { ContactDocument } from "@/models/Contact";
import { BaseRepository } from "./BaseRepository";



export class ContactRepositoryClass extends BaseRepository<ContactDocument>{
    constructor(){
        super(contact);
    }




  /**
   * Checks if a contact message already exists for the given portfolio and email.
   */
  async existsForPortfolioEmail(
    portfolioId: string,
    email: string
  ): Promise<boolean> {
    await connectDB();
    const existing = await Contact.findOne({ portfolio: portfolioId, email });
    return !!existing;
  }

    
    
}


