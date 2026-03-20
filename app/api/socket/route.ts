import { NextResponse } from "next/server";

import { attachSocketHandlers } from "@/lib/online/socketHandlers";

export { attachSocketHandlers };

export async function GET() {
  return NextResponse.json({ ok: true });
}
