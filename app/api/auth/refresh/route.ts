import { NextRequest, NextResponse } from "next/server";

import { generateAccessToken, verifyRefreshToken } from "@/lib/auth/tokens";
import { getUserById } from "@/lib/db/users";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "No refresh token provided",
        },
        { status: 401 }
      );
    }

    const payload = verifyRefreshToken(refreshToken);
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

    const tokenData: { userId: string; email: string; sessionId?: string } = {
      userId: user.id,
      email: user.email,
    };

    if (payload.sessionId) {
      tokenData.sessionId = payload.sessionId;
    }

    const newAccessToken = generateAccessToken(tokenData);

    const response = NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });

    // Update the access token cookie
    response.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
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

    console.error("Token refresh error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}