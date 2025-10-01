import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminLoginForm from "./AdminLoginForm";
import { getSessionCookieName, verifySessionToken } from "@/app/admin/utils/adminAuth";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (verifySessionToken(token)) {
    redirect("/admin/rooms");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-16">
      <AdminLoginForm />
    </main>
  );
}
