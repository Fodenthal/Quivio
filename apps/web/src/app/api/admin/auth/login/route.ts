import { NextRequest, NextResponse } from "next/server";
import { getAdminSecret, getExpectedSessionToken, getSessionCookieName, getSessionMaxAge } from "@/app/admin/utils/adminAuth";

interface LoginPayload {
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    const secret = getAdminSecret();
    const body = (await request.json().catch(() => ({}))) as LoginPayload | undefined;
    const providedPassword = body?.password;

    if (!providedPassword || providedPassword !== secret) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: getSessionCookieName(),
      value: getExpectedSessionToken(),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: getSessionMaxAge(),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Admin authentication unavailable",
      },
      { status: 500 }
    );
  }
}
