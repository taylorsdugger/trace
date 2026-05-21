import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import {
  Screen,
  TopBar,
  Card,
  Display,
  Body,
  Meta,
  Chip,
  TabBar,
} from "@/components/ui";
import { HideRingButton, MergeRingsButton } from "./RingActions";

export const dynamic = "force-dynamic";

export default async function AllRingsPage() {
  const { data } = await supabase()
    .from("themes")
    .select("id,period_start,period_end,summary_md,top_distortions,generated_at,source,window_days")
    .is("hidden_at", null)
    .order("generated_at", { ascending: false })
    .limit(20);

  const themes = data ?? [];

  // Group rings that share the same date range so we can offer a merge button.
  const groups = new Map<string, string[]>();
  for (const t of themes) {
    const key = `${t.period_start}|${t.period_end}`;
    const ids = groups.get(key) ?? [];
    ids.push(t.id);
    groups.set(key, ids);
  }

  return (
    <Screen scroll>
      <TopBar
        left={
          <Link href="/rings" style={{ color: "inherit", textDecoration: "none" }}>
            ←
          </Link>
        }
        title="rings"
      />
      <div>
        <Meta>cedar&apos;s weekly walks</Meta>
        <Display size={32} style={{ marginTop: 4 }}>
          what keeps coming back.
        </Display>
      </div>

      {themes.length === 0 && (
        <Card accent>
          <Meta accent>nothing yet</Meta>
          <Body size={13} style={{ marginTop: 6 }}>
            no rings to show. cedar will mark one once a week of traces has gathered.
          </Body>
        </Card>
      )}

      {themes.map((t) => {
        const range = `${formatDate(t.period_start)} – ${formatDate(t.period_end)}`;
        const groupKey = `${t.period_start}|${t.period_end}`;
        const groupIds = groups.get(groupKey) ?? [];
        const isDuplicate = groupIds.length > 1;
        // Only render the merge button on the first ring of a duplicate group
        // so users see one obvious action per cluster.
        const showMerge = isDuplicate && groupIds[0] === t.id;
        return (
          <Card key={t.id}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Meta>{range}</Meta>
                {isDuplicate && (
                  <Chip>
                    {t.source === "manual" ? "manual" : "auto"}
                    {t.window_days ? ` · ${t.window_days}d` : ""}
                  </Chip>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {showMerge && <MergeRingsButton ids={groupIds} count={groupIds.length} />}
                <HideRingButton id={t.id} />
              </div>
            </div>
            {t.top_distortions?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                {t.top_distortions.map((d: string) => (
                  <Chip key={d}>{d}</Chip>
                ))}
              </div>
            )}
            <div className="theme-md" style={{ marginTop: 10 }}>
              <ReactMarkdown>{t.summary_md}</ReactMarkdown>
            </div>
          </Card>
        );
      })}

      <TabBar active={3} />
    </Screen>
  );
}

function formatDate(s: string): string {
  return new Date(s)
    .toLocaleDateString(undefined, { month: "short", day: "numeric" })
    .toUpperCase();
}
