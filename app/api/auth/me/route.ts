import { NextRequest, NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/auth/tokens";
import { getUserById } from "@/lib/db/users";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "No access token provided",
        },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(accessToken);
    const user = await getUserById(payload.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 401 }
      );
    }

    console.error("Authentication error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}