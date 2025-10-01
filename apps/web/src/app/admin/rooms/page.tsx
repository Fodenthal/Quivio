import type { Metadata } from "next";
import AdminRoomsDashboard from "./AdminRoomsDashboard";

export const metadata: Metadata = {
  title: "Admin | Rooms Dashboard",
  description: "Monitor and control active trivia rooms.",
};

export default function AdminRoomsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <AdminRoomsDashboard />
    </main>
  );
}
