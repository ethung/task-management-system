import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { registerUser } from "@/lib/auth/service";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = registerSchema.parse(body);

    const registerData: { email: string; password: string; name?: string } = {
      email: validatedData.email,
      password: validatedData.password,
    };

    if (validatedData.name) {
      registerData.name = validatedData.name;
    }

    const result = await registerUser(registerData);

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please check your email to verify your account.",
      data: {
        user: result.user,
        requiresEmailVerification: true,
      },
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
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}