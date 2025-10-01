import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/app/admin/utils/adminAuth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
