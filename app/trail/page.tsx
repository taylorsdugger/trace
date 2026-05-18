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
};

async function loadEntries(): Promise<Entry[]> {
  const sb = supabase();
  const { data } = await sb
    .from("entries")
    .select("id,title,body_md,created_at,kind")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export default async function EntriesPage() {
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
        title="entries"
      />
      <div>
        <Meta>YOUR ARCHIVE</Meta>
        <Display size={32} style={{ marginTop: 4 }}>
          Everything you&apos;ve traced.
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

      <TabBar active={3} />
    </Screen>
  );
}
