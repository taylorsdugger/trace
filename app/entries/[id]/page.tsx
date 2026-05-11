import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Editor } from "@/components/Editor";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase()
    .from("entries")
    .select("id,title,body_md,mood,kind,tags")
    .eq("id", id)
    .single();
  if (error || !data) notFound();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Editor
          entry={{
            id: data.id,
            title: data.title,
            body_md: data.body_md,
            mood: data.mood,
            kind: (data.kind as "journal" | "thought_record" | "check_in") ?? "journal",
            tags: data.tags ?? [],
          }}
        />
      </main>
    </>
  );
}
