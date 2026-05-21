import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { EntriesSearch } from "@/components/EntriesSearch";
import { Screen, TopBar, Card, Display, Body, Meta, TabBar } from "@/components/ui";

export const dynamic = "force-dynamic";

type Entry = {
  id: string;
  title: string | null;
  body_md: string;
  created_at: string;
  kind: string;
  quadrant?: "red" | "yellow" | "blue" | "green" | null;
};

async function loadEntries(): Promise<Entry[]> {
  const sb = supabase();
  const { data } = await sb
    .from("entries")
    .select("id,title,body_md,created_at,kind")
    .order("created_at", { ascending: false })
    .limit(100);
  const entries = (data ?? []) as Entry[];
  if (entries.length === 0) return entries;
  const ids = entries.map((e) => e.id);
  const { data: scores } = await sb
    .from("mood_scores")
    .select("entry_id,quadrant")
    .in("entry_id", ids);
  const byId = new Map<string, "red" | "yellow" | "blue" | "green">();
  for (const s of scores ?? []) {
    if (s.entry_id && !byId.has(s.entry_id) && s.quadrant) byId.set(s.entry_id, s.quadrant);
  }
  for (const e of entries) e.quadrant = byId.get(e.id) ?? null;
  return entries;
}

export default async function TrailPage() {
  let entries: Entry[] = [];
  let error: string | null = null;
  try {
    entries = await loadEntries();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <Screen scroll>
      <TopBar
        left={
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
            ←
          </Link>
        }
        title="trail"
      />
      <div>
        <Meta>follow the trail</Meta>
        <Display size={32} style={{ marginTop: 4 }}>
          the trail behind you.
        </Display>
      </div>

      {error && (
        <Card>
          <Meta>ERROR</Meta>
          <Body size={13} style={{ marginTop: 4 }}>
            {error}
          </Body>
        </Card>
      )}

      <EntriesSearch fallback={entries} />

      <TabBar active={4} />
    </Screen>
  );
}
