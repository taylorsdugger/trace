import { supabase } from "@/lib/supabase";
import { QUADRANT_COLORS, quadrantFor } from "@/lib/emotions";
import { Card, Body, Meta } from "@/components/ui";

type Row = {
  emotion: string;
  valence: number;
  energy: number;
  created_at: string;
};

export async function MoodTrend() {
  const sb = supabase();
  const since = new Date(Date.now() - 14 * 86400 * 1000).toISOString();
  const { data, error } = await sb
    .from("mood_scores")
    .select("emotion,valence,energy,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <Card>
        <Meta>MOOD · LAST 14 DAYS</Meta>
        <Body soft size={13} style={{ marginTop: 6 }}>
          Could not load mood trend.
        </Body>
      </Card>
    );
  }

  const rows = (data ?? []) as Row[];

  if (rows.length === 0) {
    return (
      <Card>
        <Meta>MOOD · LAST 14 DAYS</Meta>
        <Body soft size={13} style={{ marginTop: 6 }}>
          No check-ins yet — your trend will appear here.
        </Body>
      </Card>
    );
  }

  const W = 280;
  const H = 40;
  const PAD = 4;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  const tMin = new Date(rows[0].created_at).getTime();
  const tMax = new Date(rows[rows.length - 1].created_at).getTime();
  const tSpan = Math.max(1, tMax - tMin);

  const xFor = (t: number) =>
    rows.length === 1 ? W / 2 : PAD + ((t - tMin) / tSpan) * innerW;
  const yFor = (v: number) => PAD + (1 - (v - 1) / 9) * innerH;

  const valencePts = rows.map((r) => `${xFor(new Date(r.created_at).getTime())},${yFor(r.valence)}`);
  const energyPts = rows.map((r) => `${xFor(new Date(r.created_at).getTime())},${yFor(r.energy)}`);

  const avgValence = rows.reduce((s, r) => s + r.valence, 0) / rows.length;
  const avgEnergy = rows.reduce((s, r) => s + r.energy, 0) / rows.length;
  const latest = rows[rows.length - 1];

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <Meta>MOOD · LAST 14 DAYS</Meta>
          <Body soft size={11} style={{ marginTop: 3 }}>
            avg pleasantness {avgValence.toFixed(1)} · avg energy {avgEnergy.toFixed(1)}
          </Body>
        </div>
        <Meta>
          LATEST <span style={{ color: "var(--color-ink)", fontWeight: 500 }}>{latest.emotion}</span>
        </Meta>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ marginTop: 10, width: "100%", height: 44, color: "var(--color-ink-soft)" }}
        aria-label="Mood trend over the last 14 days"
      >
        {rows.length >= 2 && (
          <>
            <polyline fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth={1} points={energyPts.join(" ")} />
            <polyline fill="none" stroke="currentColor" strokeOpacity={0.7} strokeWidth={1.5} points={valencePts.join(" ")} />
          </>
        )}
        {rows.map((r, i) => {
          const cx = xFor(new Date(r.created_at).getTime());
          const cy = yFor(r.valence);
          const q = quadrantFor(r.valence, r.energy);
          return <circle key={i} cx={cx} cy={cy} r={2.5} fill={QUADRANT_COLORS[q]} />;
        })}
      </svg>
    </Card>
  );
}
