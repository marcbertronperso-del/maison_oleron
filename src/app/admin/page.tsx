import { redirect } from "next/navigation";

// Admin home redirects to the calendar — the primary admin view (Story 4.3)
export default function AdminPage() {
  redirect("/admin/calendrier");
}
