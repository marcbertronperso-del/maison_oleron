"use server";

import { signOut } from "~/server/auth";

export async function adminSignOut() {
  await signOut({ redirectTo: "/admin/login" });
}
