import { supabase } from "./supabase";
import { embed } from "./openrouter";

export function chunkParagraphs(text: string, maxChars = 1200): string[] {
  const paragraphs = text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buf = "";
  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).length > maxChars && buf) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

export async function reembedEntry(entryId: string, body: string): Promise<void> {
  const sb = supabase();
  await sb.from("embeddings").delete().eq("entry_id", entryId);

  const chunks = chunkParagraphs(body);
  if (chunks.length === 0) return;

  const vectors = await embed(chunks);
  const rows = chunks.map((content, i) => ({
    entry_id: entryId,
    chunk_index: i,
    content,
    embedding: vectors[i] as unknown as string,
  }));
  const { error } = await sb.from("embeddings").insert(rows);
  if (error) throw new Error(`embeddings insert: ${error.message}`);
}
