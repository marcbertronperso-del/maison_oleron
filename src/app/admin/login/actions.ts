"use server";

import { AuthError } from "next-auth";
import { signIn } from "~/server/auth";

export async function login(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Email ou mot de passe incorrect.";
    }
    // Re-throw Next.js redirect errors so the browser follows the redirect
    throw error;
  }
  return null;
}
