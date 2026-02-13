import { authGuard } from "@/lib/authGuard";
import { devLog } from "@/lib/utils";
import { idSchema } from "@/lib/validations/template";
import { templateRepository } from "@/repositories/TemplateRepository";
import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    // Check if the user is authenticated and authorized
    const auth = await authGuard();
    if (auth instanceof NextResponse) {
      return auth;
    }

    // Extract template ID from route
    const { id } = await params;

    // Validate ID format using Zod and Mongoose ObjectId check
    const validated = idSchema.safeParse(id);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.issues[0].message,
        },
        { status: 400 }
      );
    }
    
       const templateId = validated.data;

    // Check if the original template exists
    const originalTemplate = await templateRepository.findById(templateId);
    if (!originalTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: "Template not found",
        },
        { status: 404 }
      );
    }

    
    // Duplicate the template using repository method
    const duplicatedTemplate = await templateRepository.duplicateTemplate(
      templateId
    );

    if (!duplicatedTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to duplicate template",
        },
        { status: 500 }
      );
    }

    // Return success response with duplicated template
    return NextResponse.json(
      {
        success: true,
        message: "Template duplicated successfully",
        template: duplicatedTemplate,
      },
      { status: 201 }
    );
    
    
  } catch (error) {
     devLog.error("Error duplicating template:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Handle validation errors
      if (error.message.includes("validation")) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            details: error.message,
          },
          { status: 400 }
        );
      }

      // Handle duplicate key errors (e.g., title already exists)
      if (
        error.message.includes("duplicate key") ||
        error.message.includes("E11000")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "A template with this title already exists",
          },
          { status: 409 }
        );
      }
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred while duplicating the template",
      },
      { status: 500 }
    );
  }
}
