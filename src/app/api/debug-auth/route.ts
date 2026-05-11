import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHashB64 = process.env.ADMIN_PASSWORD_HASH_B64;
  const adminHash = adminHashB64 ? Buffer.from(adminHashB64, "base64").toString("utf8") : null;
  const testPassword = "npg_hQFi81JfsGwy";

  let bcryptResult = false;
  let bcryptError = null;
  try {
    if (adminHash) {
      bcryptResult = await bcrypt.compare(testPassword, adminHash);
    }
  } catch (e) {
    bcryptError = String(e);
  }

  return NextResponse.json({
    adminEmailDefined: !!adminEmail,
    adminEmail: adminEmail ? adminEmail.slice(0, 5) + "***" : null,
    adminHashB64Defined: !!adminHashB64,
    adminHashDecoded: adminHash ? adminHash.slice(0, 7) + "***" : null,
    adminHashLength: adminHash?.length ?? 0,
    bcryptResult,
    bcryptError,
    skipEnvValidation: process.env.SKIP_ENV_VALIDATION,
  });
}
