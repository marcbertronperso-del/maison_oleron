import { createHmac, randomInt } from "crypto";
import { NextResponse } from "next/server";

export function GET() {
  const a = randomInt(1, 10);
  const b = randomInt(1, 10);
  const answer = String(a + b);
  const secret = process.env.AUTH_SECRET ?? "fallback-secret";
  const token = createHmac("sha256", secret).update(answer).digest("hex");

  return NextResponse.json({
    question: `Combien font ${a} + ${b} ?`,
    token,
  });
}
