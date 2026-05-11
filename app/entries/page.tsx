import Link from "next/link";
import { Nav } from "@/components/Nav";
import { supabase } from "@/lib/supabase";
import { EntriesSearch } from "@/components/EntriesSearch";

export const dynamic = "force-dynamic";

type Entry = { id: string; title: string | null; body_md: string; created_at: string; kind: string };

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
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Entries</h1>
          <Link href="/entries/new" className="text-sm underline">New</Link>
        </header>

        <EntriesSearch fallback={entries} />

        {error && <p className="text-sm text-red-500">{error}</p>}
      </main>
    </>
  );
}
