import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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

    // Direct JWT verification instead of using the auth config
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET not available in API route");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error",
        },
        { status: 500 }
      );
    }

    const payload = jwt.verify(accessToken, jwtSecret, {
      algorithms: ["HS256"],
      issuer: "plannerproject",
      audience: "plannerproject-users",
    }) as { userId: string; email: string; type: string };

    if (payload.type !== "access") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token type",
        },
        { status: 401 }
      );
    }

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
