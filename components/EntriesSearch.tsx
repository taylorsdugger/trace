"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Entry = { id: string; title: string | null; body_md: string; created_at: string; kind?: string; score?: number };

export function EntriesSearch({ fallback }: { fallback: Entry[] }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Entry[]>(fallback);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setResults(fallback);
        return;
      }
      setPending(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setPending(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, fallback]);

  return (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by meaning or keyword…"
        className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
      />
      {pending && <p className="text-xs text-neutral-500">Searching…</p>}
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800">
        {results.length === 0 && <li className="p-3 text-sm text-neutral-500">No entries.</li>}
        {results.map((e) => (
          <li key={e.id} className="p-3">
            <Link href={`/entries/${e.id}`} className="block">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{e.title || "(untitled)"}</span>
                <span className="text-xs text-neutral-500">{new Date(e.created_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{e.body_md.slice(0, 200)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
