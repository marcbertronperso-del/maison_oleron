import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async () => {
        // Full admin credentials auth implemented in Story 4.1
        return null;
      },
    }),
  ],
  callbacks: {
    session: ({ session }) => session,
  },
} satisfies NextAuthConfig;
