import { authGuard } from "@/lib/authGuard";
import connectDB from "@/lib/database";
import { devLog } from "@/lib/utils";
import { TemplateCreateInput, templateSchema } from "@/lib/validations/template";
import { TemplateDocument } from "@/models/Template";
import { templateRepository } from "@/repositories/TemplateRepository";
import { QueryFilter } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    // run the auth guard to ensure the user is authorised
    const auth = await authGuard();

    // if the auth fails (unauthenticated or not admin), return error response
    if (auth instanceof NextResponse) {
      return auth;
    }

    // connect to mongo db
    await connectDB();

    // Read query parameters from the URL
    const searchParams = request.nextUrl.searchParams;

    // Parse filters from query params
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const premiumParam = searchParams.get("premium");
    const premium = premiumParam === null ? undefined : premiumParam === "true";
    const tags = searchParams.getAll("tags"); // multiple tags


     // Build filters object
    const filters: QueryFilter<TemplateDocument> = { page, limit };
    if (status && status !== "all") filters.status = status;
    if (search) filters.search = search;
    if (tags.length > 0) filters.tags = tags;
    if (premium !== undefined) filters.premium = premium;

     // Fetch all templates (you can extend this with filters later)
    const templates = await templateRepository.findAllWithFilters(filters);

    // Return the templates in a JSON success response
    return NextResponse.json({
      success: true,
      templates,
    });
    
  } catch (error) {
    // Log any unexpected server error
    devLog.error("Error fetching templates: ", error);

    // Return generic 500 error
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : error,
      },
      { status: 500 },
    );
  }
}



export async function POST(req: NextRequest){
  try {
        // Run authentication guard to check user role (admin required)
    const auth = await authGuard();

    // If user is not authenticated or not an admin, return the error response
    if (auth instanceof NextResponse) {
      return auth;
    }


    // Connect to MongoDB before performing DB actions
    await connectDB();

    // Extract JSON body from the request
    const body = await req.json();
    


    // Validate input using Zod schema
    const validatedData = templateSchema.safeParse(body);

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
    const data: TemplateCreateInput = validatedData.data;

    // Create the new template in the database
    const template = await templateRepository.create(data);

    // Return 201 success response with the created template
    return NextResponse.json(
      {
        success: true,
        template,
        message: "Template created successfully",
      },
      { status: 201 }
    );
    
  } catch (error) {
    // Log any unexpected error
    devLog.error("❌ Error creating template:", error);

    // If the error is a Zod validation error (edge case)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error?.issues,
        },
        { status: 400 }
      );
    }

    // Return generic 500 error
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}

