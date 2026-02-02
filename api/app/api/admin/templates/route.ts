import { authGuard } from "@/lib/authGuard";
import { devLog } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest){
    try {
        // run the auth guard to ensure the user is authorised
        const auth = await authGuard()

        // if the auth fails (unauthenticated or not admin), return error response
        if(auth instanceof NextResponse){
            return auth;
        }
        
        
    } catch (error) {
        // Log any unexpected server error
        devLog.error("Error fetching templates: ", error)

        // Return generic 500 error 
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : error
            },
            {status: 500}
        )
        
    }
}



