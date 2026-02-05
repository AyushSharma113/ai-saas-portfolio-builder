import { authGuard } from "@/lib/authGuard";
import connectDB from "@/lib/database";
import User from "@/models/User";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";



export async function GET(req: NextRequest){

    try {
          const auth = await authGuard();
    if (auth instanceof NextResponse) {
      return auth; // early return on unauthorized or forbidden
    }

    // Connect to the database
    await connectDB();



    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const plan = searchParams.get("plan") || "";
    const status = searchParams.get("status") || "";
    const subscription = searchParams.get("subscription") || "";
    const sortBy = searchParams.get("sortBy") || "joinDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";

        // Get all users from Clerk
    const clerkUsers = (await clerkClient()).users.getUserList({
      limit: 500, // Get a large number of users, we'll handle pagination ourselves
    });

    // Filter users based on search, role, status, subscription
    let filteredUsers = (await clerkUsers).data;


    // Filter by search (name or email)
    if (search) {
      filteredUsers = filteredUsers.filter((user) => {
        const name =
          (user.publicMetadata.name as string) || user.firstName || "";
        const email = user.emailAddresses[0]?.emailAddress || "";
        return (
          name.toLowerCase().includes(search.toLowerCase()) ||
          email.toLowerCase().includes(search.toLowerCase())
        );
      });
    }



     // Filter by role
    if (role && role !== "all") {
      filteredUsers = filteredUsers.filter(
        (user) => user.privateMetadata.role === role
      );
    }

    // Filter by plan
    if (plan) {
      filteredUsers = filteredUsers.filter(
        (user) => user.privateMetadata.plan === plan
      );
    }

    // Filter by status
    if (status && status !== "all") {
      filteredUsers = filteredUsers.filter(
        (user) => user.privateMetadata.status === status
      );
    }

    // Filter by subscription
    if (subscription && subscription !== "all") {
      filteredUsers = filteredUsers.filter(
        (user) => user.privateMetadata.subscription === subscription
      );
    }

    
    // Sort users
    filteredUsers.sort((a, b) => {
      let valueA, valueB;

      // Handle different sort fields
      switch (sortBy) {
        case "name":
          valueA = (a.publicMetadata.name as string) || a.firstName || "";
          valueB = (b.publicMetadata.name as string) || b.firstName || "";
          break;
        case "role":
          valueA = (a.privateMetadata.role as string) || "free";
          valueB = (b.privateMetadata.role as string) || "free";
          break;
        case "status":
          valueA = (a.privateMetadata.status as string) || "active";
          valueB = (b.privateMetadata.status as string) || "active";
          break;
        case "subscription":
          valueA = (a.privateMetadata.subscription as string) || "free";
          valueB = (b.privateMetadata.subscription as string) || "free";
          break;
        case "joinDate":
        default:
          valueA = new Date(a.createdAt).getTime();
          valueB = new Date(b.createdAt).getTime();
          break;
      }
      // Sort in ascending or descending order
      if (sortOrder === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

     // Get total count
    const total = filteredUsers.length;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Get user IDs for database lookup
    const userIds = paginatedUsers.map((user) => user.id);

    // Get additional user data from MongoDB
    const dbUsers = await User.find({ clerkId: { $in: userIds } });

    // Map Clerk users to our response format
    const users = paginatedUsers.map((clerkUser) => {
      // Find corresponding DB user
      const dbUser = dbUsers.find((u) => u.clerkId === clerkUser.id);

      // Create combined user object
      return {
        ...dbUser,
      };
    });
        

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
    } catch (error) {
        // sentry wil come here
        return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    }
    
}

