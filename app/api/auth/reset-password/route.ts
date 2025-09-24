import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { resetPassword } from "@/lib/auth/service";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = resetPasswordSchema.parse(body);

    const result = await resetPassword(validatedData.token, validatedData.password);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Password reset failed",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
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

    console.error("Password reset error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}