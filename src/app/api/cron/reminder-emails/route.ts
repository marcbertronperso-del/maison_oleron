import { type NextRequest, NextResponse } from "next/server";

// Full implementation in Story 3.12
export function GET(_req: NextRequest) {
  return NextResponse.json({ ok: true });
}
