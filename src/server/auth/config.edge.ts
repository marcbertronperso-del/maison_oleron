import type { NextAuthConfig } from "next-auth";

// Lightweight config for Edge middleware — no bcrypt, no heavy providers.
// Session validation uses AUTH_SECRET (JWT) which is Edge-compatible.
// The full config (config.ts) is used for the login flow only.
export const authEdgeConfig = {
  providers: [],
  pages: { signIn: "/admin/login" },
  callbacks: {
    session: ({ session }) => session,
  },
} satisfies NextAuthConfig;
