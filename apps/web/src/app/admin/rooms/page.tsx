import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminRoomsDashboard from "./AdminRoomsDashboard";
import { getSessionCookieName, verifySessionToken } from "@/app/admin/utils/adminAuth";

export const metadata: Metadata = {
  title: "Admin | Rooms Dashboard",
  description: "Monitor and control active trivia rooms.",
};

export default async function AdminRoomsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!verifySessionToken(token)) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <AdminRoomsDashboard />
    </main>
  );
}
