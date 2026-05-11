import Link from "next/link";
import { Nav } from "@/components/Nav";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function loadDashboard() {
  const sb = supabase();
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

  const [recentRes, themesRes, datesRes] = await Promise.all([
    sb.from("entries").select("id,title,body_md,created_at,kind").order("created_at", { ascending: false }).limit(5),
    sb.from("themes").select("id,period_start,period_end,summary_md,top_distortions,generated_at").order("generated_at", { ascending: false }).limit(1),
    sb.from("entries").select("created_at").gte("created_at", since).order("created_at", { ascending: false }),
  ]);

  const datesSet = new Set<string>();
  for (const r of datesRes.data ?? []) {
    datesSet.add(new Date(r.created_at).toISOString().slice(0, 10));
  }
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (datesSet.has(key)) streak++;
    else if (i === 0) continue; // allow today not yet written
    else break;
  }

  return {
    recent: recentRes.data ?? [],
    latestTheme: themesRes.data?.[0] ?? null,
    streak,
  };
}

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof loadDashboard>> | null = null;
  let error: string | null = null;
  try {
    data = await loadDashboard();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        <header>
          <h1 className="text-2xl font-semibold">Today</h1>
          <p className="text-sm text-neutral-500">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </header>

        {error && (
          <div className="rounded border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-900 p-3 text-sm">
            Could not load dashboard: {error}
          </div>
        )}

        {data && (
          <>
            <section className="grid grid-cols-2 gap-3">
              <Link href="/check-in" className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-100 dark:hover:bg-neutral-900">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Start</div>
                <div className="mt-1 font-medium">Daily check-in</div>
              </Link>
              <Link href="/entries/new" className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-100 dark:hover:bg-neutral-900">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Write</div>
                <div className="mt-1 font-medium">New entry</div>
              </Link>
            </section>

            <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500">Streak</div>
              <div className="mt-1 text-2xl font-semibold">{data.streak} day{data.streak === 1 ? "" : "s"}</div>
            </section>

            <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500">Latest theme summary</div>
              {data.latestTheme ? (
                <>
                  <div className="mt-1 text-sm text-neutral-500">
                    {data.latestTheme.period_start} – {data.latestTheme.period_end}
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap text-sm">{data.latestTheme.summary_md}</pre>
                </>
              ) : (
                <p className="mt-1 text-sm text-neutral-500">No themes generated yet. Run the weekly summary once you have entries.</p>
              )}
            </section>

            <section>
              <h2 className="text-sm font-medium mb-2">Recent entries</h2>
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800">
                {data.recent.length === 0 && <li className="p-3 text-sm text-neutral-500">No entries yet.</li>}
                {data.recent.map((e) => (
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
            </section>
          </>
        )}
      </main>
    </>
  );
}
