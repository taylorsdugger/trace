import { Nav } from "@/components/Nav";
import { Editor } from "@/components/Editor";

export default function NewEntryPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Editor entry={{ title: "", body_md: "", mood: null, kind: "journal", tags: [] }} />
      </main>
    </>
  );
}
