import { NextRequest, NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/auth/tokens";
import { deleteUser } from "@/lib/db/users";

export async function DELETE(request: NextRequest) {
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

    // Delete the user account
    await deleteUser(payload.userId);

    // Clear authentication cookies
    const response = NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });

    response.cookies.set("accessToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
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

    console.error("Account deletion error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}