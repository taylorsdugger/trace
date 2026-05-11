import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { embed } from "@/lib/openrouter";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  const sb = supabase();
  try {
    const [vec] = await embed([q]);
    const { data, error } = await sb.rpc("search_entries", {
      query_embedding: vec as unknown as string,
      query_text: q,
      match_count: 20,
    });
    if (error) throw error;
    const results = (data ?? []).map((r: { entry_id: string; title: string | null; body_md: string; created_at: string; score: number }) => ({
      id: r.entry_id,
      title: r.title,
      body_md: r.body_md,
      created_at: r.created_at,
      score: r.score,
    }));
    return NextResponse.json({ results });
  } catch (e) {
    // Fallback to keyword-only if embeddings/RPC unavailable.
    const { data } = await sb
      .from("entries")
      .select("id,title,body_md,created_at")
      .or(`title.ilike.%${q}%,body_md.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);
    return NextResponse.json({ results: data ?? [], fallback: true, error: (e as Error).message });
  }
}
