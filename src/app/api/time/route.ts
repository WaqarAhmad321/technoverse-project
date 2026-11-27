import { NextResponse } from "next/server";

// The system check compares this with the device clock and times the round trip.
export function GET() {
  return NextResponse.json({ server_now: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
