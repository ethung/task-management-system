import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { verifyAccessToken } from "@/lib/auth/tokens";
import { changePassword } from "@/lib/auth/service";
import { changePasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    const validatedData = changePasswordSchema.parse(body);

    const result = await changePassword({
      userId: payload.userId,
      currentPassword: validatedData.currentPassword,
      newPassword: validatedData.newPassword,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Password change failed",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 401 }
      );
    }

    console.error("Password change error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}