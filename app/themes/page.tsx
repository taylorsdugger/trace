import Link from "next/link";
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

export const dynamic = "force-dynamic";

export default async function ThemesPage() {
  const { data } = await supabase()
    .from("themes")
    .select("id,period_start,period_end,summary_md,top_distortions,generated_at")
    .order("generated_at", { ascending: false })
    .limit(20);

  const themes = data ?? [];

  return (
    <Screen scroll>
      <TopBar
        left={
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
            ←
          </Link>
        }
        title="themes"
      />
      <div>
        <Meta>WEEKLY PATTERNS</Meta>
        <Display size={32} style={{ marginTop: 4 }}>
          What&apos;s recurring.
        </Display>
      </div>

      {themes.length === 0 && (
        <Card accent>
          <Meta accent>EMPTY</Meta>
          <Body size={13} style={{ marginTop: 6 }}>
            No themes generated yet. POST /api/ai/themes with your CRON_SECRET to generate the first one, or wait for the weekly cron.
          </Body>
        </Card>
      )}

      {themes.map((t) => {
        const range = `${formatDate(t.period_start)} – ${formatDate(t.period_end)}`;
        return (
          <Card key={t.id}>
            <Meta>{range}</Meta>
            {t.top_distortions?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                {t.top_distortions.map((d: string) => (
                  <Chip key={d}>{d}</Chip>
                ))}
              </div>
            )}
            <Body size={14} style={{ marginTop: 10, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
              {t.summary_md}
            </Body>
          </Card>
        );
      })}

      <TabBar active={2} />
    </Screen>
  );
}

function formatDate(s: string): string {
  return new Date(s)
    .toLocaleDateString(undefined, { month: "short", day: "numeric" })
    .toUpperCase();
}
