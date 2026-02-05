import { authGuard } from "@/lib/authGuard";
import connectDB from "@/lib/database";
import { userRepository } from "@/repositories/UserRepository";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if the user is authenticated and has admin role
    const auth = await authGuard();
    if (auth instanceof NextResponse) {
      return auth; // early return on unauthorized or forbidden
    }

    // Connect to the database
    const { id } = await params;
    await connectDB();

    // Get the user from our database
    const user = await userRepository.findByClerkId(id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    // Sentry.captureException(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}