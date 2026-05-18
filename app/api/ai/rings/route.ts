import { NextResponse, type NextRequest } from "next/server";
import { generateRing, type RingWindow, type RingSource } from "@/lib/rings";

export async function GET() {
  const result = await generateRing({ window: "since-last", source: "auto" });
  return toResponse(result);
}

export async function POST(req: NextRequest) {
  let body: { window?: RingWindow; source?: RingSource } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // empty body is fine
  }
  const result = await generateRing({
    window: body.window,
    source: body.source ?? "manual",
  });
  return toResponse(result);
}

function toResponse(result: Awaited<ReturnType<typeof generateRing>>) {
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}
