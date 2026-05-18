import Link from "next/link";
import { notFound } from "next/navigation";
import { Editor } from "@/components/Editor";
import { supabase } from "@/lib/supabase";
import { Screen, TopBar } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabase();
  const [entryRes, moodRes] = await Promise.all([
    sb
      .from("entries")
      .select("id,title,body_md,mood,kind,tags,created_at")
      .eq("id", id)
      .single(),
    sb
      .from("mood_scores")
      .select("emotion,sleep_hours")
      .eq("entry_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const { data, error } = entryRes;
  if (error || !data) notFound();

  return (
    <Screen scroll>
      <TopBar
        left={
          <Link href="/entries" style={{ color: "inherit", textDecoration: "none" }}>
            ←
          </Link>
        }
        title="entry"
      />
      <Editor
        entry={{
          id: data.id,
          title: data.title,
          body_md: data.body_md,
          mood: data.mood,
          kind: (data.kind as "journal" | "thought_record" | "check_in") ?? "journal",
          tags: data.tags ?? [],
          createdAt: data.created_at,
          emotion: moodRes.data?.emotion ?? null,
          sleepHours: moodRes.data?.sleep_hours ?? null,
        }}
      />
    </Screen>
  );
}
