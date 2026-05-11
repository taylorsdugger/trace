import { Nav } from "@/components/Nav";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function ThemesPage() {
  const { data } = await supabase()
    .from("themes")
    .select("id,period_start,period_end,summary_md,top_distortions,generated_at")
    .order("generated_at", { ascending: false })
    .limit(20);

  const themes = data ?? [];

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-semibold">Themes</h1>
        {themes.length === 0 && <p className="text-sm text-neutral-500">No themes generated yet. POST /api/ai/themes with your CRON_SECRET to generate the first one, or wait for the weekly cron.</p>}
        <ul className="space-y-4">
          {themes.map((t) => (
            <li key={t.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
              <div className="text-xs text-neutral-500">{t.period_start} – {t.period_end}</div>
              {t.top_distortions?.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  {t.top_distortions.map((d: string) => (
                    <span key={d} className="rounded-full border border-neutral-300 dark:border-neutral-700 px-2 py-0.5">{d}</span>
                  ))}
                </div>
              )}
              <pre className="mt-2 whitespace-pre-wrap text-sm">{t.summary_md}</pre>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
