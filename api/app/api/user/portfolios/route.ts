import connectDB from "@/lib/database";
import { devLog, generateSlug } from "@/lib/utils";
import { createPortfolioSchema, PortfolioInput } from "@/lib/validations/portfolio";
import { PortfolioDocument } from "@/models/Portfolio";
import { portfolioRepository } from "@/repositories/PortfolioRepository";
import { CreatePortfolioRequest } from "@/types/portfolio";
import { userRepository } from "@/repositories/UserRepository";
import { auth } from "@clerk/nextjs/server";
import { QueryFilter } from "mongoose";
import { NextRequest, NextResponse } from "next/server";



export async function GET(request: NextRequest){
    try {
         // Connect to MongoDB before performing DB actions
    await connectDB();

    // Run the auth guard to ensure the user is logged in and authorized
    const { userId } = await auth();

    // If auth fails (unauthenticated or not admin), return error response
    if (!userId) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 401 }
      );
    }


    
    const { searchParams } = new URL(request.url);

    // Parse filters from query params
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const templateId = searchParams.get("templateId");

      // Build filters object
    const filters: QueryFilter<PortfolioDocument> = { page, limit };
    if (status && status !== "all") filters.status = status;
    if (templateId) filters.templateId = search;

    const user = await userRepository.findByClerkId(userId);
    if (!user) {
      // handle not found
      throw new Error("User not found");
    }


     const portfolios = await portfolioRepository.findByUserId(
      user._id.toString(),
      filters
    );

    return NextResponse.json({
      success: true,
      portfolios,
    });
    

    } catch (error) {
        devLog.error("Error in GET /api/user/portfolios:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



export async function POST(request: NextRequest){
    try {
         // Connect to MongoDB before performing DB actions
    await connectDB();

    // Run the auth guard to ensure the user is logged in and authorized
    const { userId } = await auth();

    // If auth fails (unauthenticated or not admin), return error response
    if (!userId) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const user = await userRepository.findByClerkId(userId);

    if (!user) {
      // handle not found
      throw new Error("User not found");
    }

     // Validate input using Zod schema
    const slug = generateSlug(body.name);
    const validatedData = createPortfolioSchema.safeParse({
      ...body,
      slug: slug,
      userId: user._id.toString(),
    });

    // If validation fails, return 400 with detailed errors
    if (!validatedData.success) {
      return NextResponse.json(
        {
          message: "validation error",
          errors: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    
    // Extract typed, validated data for creation
    const data: PortfolioInput = validatedData.data;

    const createData: CreatePortfolioRequest = {
      userId: data.userId,
      name: data.name,
      templateId: data.templateId,
      slug: data.slug,
      profile: data.profile,
      skills: data.skills,
      certifications: data.certifications,
      experiences: data.experiences.map((exp) => ({
        ...exp,
        endDate: exp.endDate ?? null,
      })),
      projects: data.projects,
      settings: data.settings,
    };

    devLog.error("Creating portfolio with data:", createData);
    const portfolio = await portfolioRepository.createPortfolio(createData);

    if (!portfolio) {
      return NextResponse.json(
        { error: "Failed to create portfolio" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, portfolio }, { status: 201 });
    
    } catch (error) {
    devLog.error("Error in POST /api/user/portfolios:", error);

    return NextResponse.json(
      { error: "Internal server error" + error },
      { status: 500 }
    );
  }
}
