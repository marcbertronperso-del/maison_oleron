import bcrypt from "bcryptjs";
import { z } from "zod";
import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig = {
  providers: [
    Credentials({
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminHashB64 = process.env.ADMIN_PASSWORD_HASH_B64;
        if (!adminEmail || !adminHashB64) return null;
        const adminHash = Buffer.from(adminHashB64, "base64").toString("utf8");
        if (email !== adminEmail) return null;

        const isValid = await bcrypt.compare(password, adminHash);
        if (!isValid) return null;

        return { id: "admin", email, name: "Admin" };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    session: ({ session }) => session,
  },
} satisfies NextAuthConfig;
