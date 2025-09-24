import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { verifyAccessToken } from "@/lib/auth/tokens";
import { updateUser, getUserById } from "@/lib/db/users";
import { updateProfileSchema } from "@/lib/validations/auth";

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

    console.error("Profile fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const validatedData = updateProfileSchema.parse(body);

    // Update user profile
    const updateData: { name?: string; avatar?: string } = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }

    // Note: avatar update would require file upload handling
    // For now, we'll skip avatar updates in this implementation

    const updatedUser = await updateUser(payload.userId, updateData);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser },
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

    console.error("Profile update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}