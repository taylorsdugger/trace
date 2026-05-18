export type Quadrant = "yellow" | "green" | "blue" | "red";

// Each emotion's (x, y) is its bubble position in 0..1 space on the mood meter.
// (0,0) = top-left, (1,1) = bottom-right. Left = unpleasant, right = pleasant.
// Top = high energy, bottom = low energy. Quadrant is determined by position.
export type Emotion = {
  id: number;
  word: string;
  x: number;
  y: number;
  quadrant: Quadrant;
  definition?: string;
};

// valence and energy are 0..10 integer scales derived from position, for
// storage/analytics. They get persisted to int columns in mood_scores, so
// round to a whole number rather than returning a float.
export function valenceOf(e: { x: number }): number {
  return Math.round(e.x * 10);
}
export function energyOf(e: { y: number }): number {
  return Math.round((1 - e.y) * 10);
}

// 36 emotions per quadrant on a 6×6 sub-grid. Most intense feeling sits at the
// outer corner of each quadrant.
const C = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((c) => c / 11);
const R = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((r) => r / 11);

// Stable integer ids are assigned by index (1..N) so they can be stored as INT
// in the `entries.mood` / `check_ins.mood` columns. NEVER renumber or reorder
// existing emotions — only append new ones at the end with new ids.
const RAW_EMOTIONS: Omit<Emotion, "id">[] = [
  // red — high energy, unpleasant (top-left). Corner = (col 0, row 0) = enraged.
  { word: "enraged",      x: C[0], y: R[0], quadrant: "red", definition: "anger so hot it takes over completely" },
  { word: "furious",      x: C[1], y: R[0], quadrant: "red", definition: "shaking with intense, focused anger" },
  { word: "terrified",    x: C[2], y: R[0], quadrant: "red", definition: "gripped by fear that overrides everything else" },
  { word: "horrified",    x: C[3], y: R[0], quadrant: "red", definition: "stunned by something deeply wrong" },
  { word: "panicked",     x: C[4], y: R[0], quadrant: "red", definition: "fear racing faster than you can think" },
  { word: "alarmed",      x: C[5], y: R[0], quadrant: "red", definition: "suddenly alert to a threat" },
  { word: "livid",        x: C[0], y: R[1], quadrant: "red", definition: "cold, sharp-edged anger you can barely contain" },
  { word: "angry",        x: C[1], y: R[1], quadrant: "red", definition: "burning at something that feels unfair" },
  { word: "afraid",       x: C[2], y: R[1], quadrant: "red", definition: "bracing against something that could hurt you" },
  { word: "scared",       x: C[3], y: R[1], quadrant: "red", definition: "small inside in the face of something bigger" },
  { word: "anxious",      x: C[4], y: R[1], quadrant: "red", definition: "keyed up about something that might go wrong" },
  { word: "nervous",      x: C[5], y: R[1], quadrant: "red", definition: "fluttery in anticipation of what's next" },
  { word: "shocked",      x: C[0], y: R[2], quadrant: "red", definition: "knocked off balance by something unexpected" },
  { word: "frightened",   x: C[1], y: R[2], quadrant: "red", definition: "startled into fear, heart still racing" },
  { word: "mad",          x: C[2], y: R[2], quadrant: "red", definition: "fired up at someone or something" },
  { word: "jittery",      x: C[3], y: R[2], quadrant: "red", definition: "wired, can't quite settle into your skin" },
  { word: "outraged",     x: C[4], y: R[2], quadrant: "red", definition: "morally lit up by something that shouldn't be" },
  { word: "irate",        x: C[5], y: R[2], quadrant: "red", definition: "boiling over, ready to say it" },
  { word: "disgusted",    x: C[0], y: R[3], quadrant: "red", definition: "repelled, wanting distance from it" },
  { word: "agitated",     x: C[1], y: R[3], quadrant: "red", definition: "stirred up and unable to be still" },
  { word: "overwhelmed",  x: C[2], y: R[3], quadrant: "red", definition: "more coming at you than you can hold" },
  { word: "stressed",     x: C[3], y: R[3], quadrant: "red", definition: "pulled tight by too many demands" },
  { word: "frustrated",   x: C[4], y: R[3], quadrant: "red", definition: "blocked from something you want" },
  { word: "frazzled",     x: C[5], y: R[3], quadrant: "red", definition: "worn thin by too much, too fast" },
  { word: "rushed",       x: C[0], y: R[4], quadrant: "red", definition: "pressed for time, scrambling to keep up" },
  { word: "pressured",    x: C[1], y: R[4], quadrant: "red", definition: "weight bearing down to deliver or decide" },
  { word: "contempt",     x: C[2], y: R[4], quadrant: "red", definition: "looking down on something as beneath you" },
  { word: "resentful",    x: C[3], y: R[4], quadrant: "red", definition: "quietly holding onto an old wound" },
  { word: "indignant",    x: C[4], y: R[4], quadrant: "red", definition: "offended by something that crossed a line" },
  { word: "exasperated",  x: C[5], y: R[4], quadrant: "red", definition: "out of patience after one thing too many" },
  { word: "irritated",    x: C[0], y: R[5], quadrant: "red", definition: "low-grade annoyance scratching at you" },
  { word: "irritable",    x: C[1], y: R[5], quadrant: "red", definition: "everything is getting under your skin today" },
  { word: "apprehensive", x: C[2], y: R[5], quadrant: "red", definition: "uneasy about what's coming next" },
  { word: "dread",        x: C[3], y: R[5], quadrant: "red", definition: "heavy certainty that something bad is ahead" },
  { word: "triggered",    x: C[4], y: R[5], quadrant: "red", definition: "an old wound suddenly back in the room" },
  { word: "pissed",       x: C[5], y: R[5], quadrant: "red", definition: "blunt, fed-up anger" },

  // yellow — high energy, pleasant (top-right). Corner = (col 11, row 0) = ecstatic.
  { word: "awe",          x: C[6],  y: R[0], quadrant: "yellow", definition: "wide open in the presence of something vast" },
  { word: "amazed",       x: C[7],  y: R[0], quadrant: "yellow", definition: "struck by something better than you imagined" },
  { word: "astonished",   x: C[8],  y: R[0], quadrant: "yellow", definition: "breath caught by something hard to believe" },
  { word: "exhilarated",  x: C[9],  y: R[0], quadrant: "yellow", definition: "lifted, electric, fully turned on" },
  { word: "thrilled",     x: C[10], y: R[0], quadrant: "yellow", definition: "sparking with delight at what just happened" },
  { word: "ecstatic",     x: C[11], y: R[0], quadrant: "yellow", definition: "joy so big it spills over" },
  { word: "curious",      x: C[6],  y: R[1], quadrant: "yellow", definition: "pulled toward something you want to understand" },
  { word: "surprised",    x: C[7],  y: R[1], quadrant: "yellow", definition: "caught off guard in a good way" },
  { word: "happy",        x: C[8],  y: R[1], quadrant: "yellow", definition: "an easy, bright kind of good" },
  { word: "delighted",    x: C[9],  y: R[1], quadrant: "yellow", definition: "small joy bubbling up from a moment" },
  { word: "excited",      x: C[10], y: R[1], quadrant: "yellow", definition: "buzzing with eager anticipation" },
  { word: "euphoric",     x: C[11], y: R[1], quadrant: "yellow", definition: "soaring, almost too good to hold" },
  { word: "stoked",       x: C[6],  y: R[2], quadrant: "yellow", definition: "fired up and ready for what's coming" },
  { word: "fascinated",   x: C[7],  y: R[2], quadrant: "yellow", definition: "fully absorbed in something interesting" },
  { word: "joyful",       x: C[8],  y: R[2], quadrant: "yellow", definition: "lit up with happiness and delight" },
  { word: "blissful",     x: C[9],  y: R[2], quadrant: "yellow", definition: "deep, glowing happiness with nothing missing" },
  { word: "overjoyed",    x: C[10], y: R[2], quadrant: "yellow", definition: "joy that overflows what you can contain" },
  { word: "elated",       x: C[11], y: R[2], quadrant: "yellow", definition: "high and bright after something wonderful" },
  { word: "inspired",     x: C[6],  y: R[3], quadrant: "yellow", definition: "lit up with possibility, wanting to create" },
  { word: "proud",        x: C[7],  y: R[3], quadrant: "yellow", definition: "warmed by something you did or are" },
  { word: "empowered",    x: C[8],  y: R[3], quadrant: "yellow", definition: "capable, with the agency to act" },
  { word: "motivated",    x: C[9],  y: R[3], quadrant: "yellow", definition: "drawn forward toward something that matters" },
  { word: "energized",    x: C[10], y: R[3], quadrant: "yellow", definition: "full of fuel and ready to go" },
  { word: "glowing",      x: C[11], y: R[3], quadrant: "yellow", definition: "radiating quiet, full-bodied happiness" },
  { word: "cheerful",     x: C[6],  y: R[4], quadrant: "yellow", definition: "lightly bright, easy to smile" },
  { word: "enthusiastic", x: C[7],  y: R[4], quadrant: "yellow", definition: "leaning in, all-in on what's in front of you" },
  { word: "determined",   x: C[8],  y: R[4], quadrant: "yellow", definition: "set on something, not letting it go" },
  { word: "upbeat",       x: C[9],  y: R[4], quadrant: "yellow", definition: "carrying a quiet, positive lift today" },
  { word: "eager",        x: C[10], y: R[4], quadrant: "yellow", definition: "ready and wanting to get into it" },
  { word: "buoyant",      x: C[11], y: R[4], quadrant: "yellow", definition: "light, springy, hard to bring down" },
  { word: "playful",      x: C[6],  y: R[5], quadrant: "yellow", definition: "loose and game for fun" },
  { word: "amused",       x: C[7],  y: R[5], quadrant: "yellow", definition: "tickled by something funny" },
  { word: "hopeful",      x: C[8],  y: R[5], quadrant: "yellow", definition: "trusting that good things are coming" },
  { word: "optimistic",   x: C[9],  y: R[5], quadrant: "yellow", definition: "expecting it to work out in the end" },
  { word: "encouraged",   x: C[10], y: R[5], quadrant: "yellow", definition: "lifted by a sign that you're on the right path" },
  { word: "alive",        x: C[11], y: R[5], quadrant: "yellow", definition: "fully present and humming with being here" },

  // blue — low energy, unpleasant (bottom-left). Corner = (col 0, row 11) = despairing.
  { word: "pessimistic",  x: C[0], y: R[6], quadrant: "blue", definition: "expecting things to go badly" },
  { word: "vulnerable",   x: C[1], y: R[6], quadrant: "blue", definition: "exposed, with your soft places showing" },
  { word: "worried",      x: C[2], y: R[6], quadrant: "blue", definition: "mind looping on what could go wrong" },
  { word: "disheartened", x: C[3], y: R[6], quadrant: "blue", definition: "the wind taken out of you" },
  { word: "disappointed", x: C[4], y: R[6], quadrant: "blue", definition: "let down by how it turned out" },
  { word: "unappreciated",x: C[5], y: R[6], quadrant: "blue", definition: "giving more than is being noticed" },
  { word: "discontented", x: C[0], y: R[7], quadrant: "blue", definition: "low hum of this isn't quite right" },
  { word: "dissatisfied", x: C[1], y: R[7], quadrant: "blue", definition: "what you have isn't what you wanted" },
  { word: "isolated",     x: C[2], y: R[7], quadrant: "blue", definition: "separate from others, even when they're near" },
  { word: "lonely",       x: C[3], y: R[7], quadrant: "blue", definition: "cut off, missing real connection" },
  { word: "lost",         x: C[4], y: R[7], quadrant: "blue", definition: "no clear direction, unsure where you are" },
  { word: "sad",          x: C[5], y: R[7], quadrant: "blue", definition: "heavy with loss or disappointment" },
  { word: "dejected",     x: C[0], y: R[8], quadrant: "blue", definition: "cast down by something that didn't go your way" },
  { word: "discouraged",  x: C[1], y: R[8], quadrant: "blue", definition: "losing faith that it'll work out" },
  { word: "troubled",     x: C[2], y: R[8], quadrant: "blue", definition: "something is weighing on you and won't leave" },
  { word: "melancholic",  x: C[3], y: R[8], quadrant: "blue", definition: "a soft, lingering sadness without a clear edge" },
  { word: "stuck",        x: C[4], y: R[8], quadrant: "blue", definition: "unable to move forward no matter what you try" },
  { word: "regretful",    x: C[5], y: R[8], quadrant: "blue", definition: "wishing you'd done it differently" },
  { word: "abandoned",    x: C[0], y: R[9], quadrant: "blue", definition: "left behind by someone who was supposed to stay" },
  { word: "defeated",     x: C[1], y: R[9], quadrant: "blue", definition: "out of fight after losing the thing you tried for" },
  { word: "ashamed",      x: C[2], y: R[9], quadrant: "blue", definition: "wanting to disappear from what you did or are" },
  { word: "helpless",     x: C[3], y: R[9], quadrant: "blue", definition: "no power to change what's happening" },
  { word: "betrayed",     x: C[4], y: R[9], quadrant: "blue", definition: "trust broken by someone you let in" },
  { word: "guilty",       x: C[5], y: R[9], quadrant: "blue", definition: "carrying the weight of having hurt or failed" },
  { word: "exhausted",    x: C[0], y: R[10], quadrant: "blue", definition: "bone tired, all the way through" },
  { word: "drained",      x: C[1], y: R[10], quadrant: "blue", definition: "empty, with nothing left to give" },
  { word: "hollow",       x: C[2], y: R[10], quadrant: "blue", definition: "scooped out, nothing where feeling should be" },
  { word: "numb",         x: C[3], y: R[10], quadrant: "blue", definition: "shut down, unable to feel much of anything" },
  { word: "empty",        x: C[4], y: R[10], quadrant: "blue", definition: "nothing inside where something used to be" },
  { word: "heartbroken",  x: C[5], y: R[10], quadrant: "blue", definition: "split open by losing what you loved" },
  { word: "despairing",   x: C[0], y: R[11], quadrant: "blue", definition: "no light, no way out you can see" },
  { word: "hopeless",     x: C[1], y: R[11], quadrant: "blue", definition: "nothing left to believe it could get better" },
  { word: "miserable",    x: C[2], y: R[11], quadrant: "blue", definition: "deep, soaking unhappiness" },
  { word: "depressed",    x: C[3], y: R[11], quadrant: "blue", definition: "heavy, flat, everything dimmed" },
  { word: "rejected",     x: C[4], y: R[11], quadrant: "blue", definition: "turned away by someone whose yes mattered" },
  { word: "humiliated",   x: C[5], y: R[11], quadrant: "blue", definition: "shrunk small by being exposed in front of others" },

  // green — low energy, pleasant (bottom-right). Corner = (col 11, row 11) = serene.
  { word: "focused",      x: C[6],  y: R[6], quadrant: "green", definition: "attention pointed and clear" },
  { word: "engaged",      x: C[7],  y: R[6], quadrant: "green", definition: "leaned in, mind and body involved" },
  { word: "glad",         x: C[8],  y: R[6], quadrant: "green", definition: "quietly happy that things are this way" },
  { word: "pleased",      x: C[9],  y: R[6], quadrant: "green", definition: "a small, warm yes to what's happening" },
  { word: "grateful",     x: C[10], y: R[6], quadrant: "green", definition: "softly aware of what you've been given" },
  { word: "thankful",     x: C[11], y: R[6], quadrant: "green", definition: "warm appreciation for someone or something" },
  { word: "refreshed",    x: C[6],  y: R[7], quadrant: "green", definition: "clear and renewed, like after good rest" },
  { word: "rejuvenated",  x: C[7],  y: R[7], quadrant: "green", definition: "filled back up, alive in your body again" },
  { word: "present",      x: C[8],  y: R[7], quadrant: "green", definition: "fully here, not somewhere else in your head" },
  { word: "attentive",    x: C[9],  y: R[7], quadrant: "green", definition: "quietly tuned in to what's in front of you" },
  { word: "understood",   x: C[10], y: R[7], quadrant: "green", definition: "someone actually sees what you mean" },
  { word: "valued",       x: C[11], y: R[7], quadrant: "green", definition: "what you bring is seen and counted" },
  { word: "loved",        x: C[6],  y: R[8], quadrant: "green", definition: "held in someone's care, as you are" },
  { word: "supported",    x: C[7],  y: R[8], quadrant: "green", definition: "someone has your back" },
  { word: "grounded",     x: C[8],  y: R[8], quadrant: "green", definition: "rooted, steady, hard to knock over" },
  { word: "blessed",      x: C[9],  y: R[8], quadrant: "green", definition: "lucky in a way that feels almost given" },
  { word: "calm",         x: C[10], y: R[8], quadrant: "green", definition: "free of stress, agitation, and worry" },
  { word: "fulfilled",    x: C[11], y: R[8], quadrant: "green", definition: "what you needed has been answered" },
  { word: "heard",        x: C[6],  y: R[9], quadrant: "green", definition: "your voice landed and someone took it in" },
  { word: "accepted",     x: C[7],  y: R[9], quadrant: "green", definition: "you belong here as you are" },
  { word: "safe",         x: C[8],  y: R[9], quadrant: "green", definition: "nothing here is going to hurt you" },
  { word: "secure",       x: C[9],  y: R[9], quadrant: "green", definition: "steady ground beneath you, sure of where you stand" },
  { word: "satisfied",    x: C[10], y: R[9], quadrant: "green", definition: "this is enough; nothing missing right now" },
  { word: "balanced",     x: C[11], y: R[9], quadrant: "green", definition: "the parts of your life in proportion" },
  { word: "stable",       x: C[6],  y: R[10], quadrant: "green", definition: "even-keeled, holding steady" },
  { word: "at_ease",      x: C[7],  y: R[10], quadrant: "green", definition: "comfortable in your own skin, nothing to perform" },
  { word: "loving",       x: C[8],  y: R[10], quadrant: "green", definition: "tender and warm toward someone else" },
  { word: "nostalgic",    x: C[9],  y: R[10], quadrant: "green", definition: "a sweet ache pulling toward something past" },
  { word: "comfortable",  x: C[10], y: R[10], quadrant: "green", definition: "soft, easy, nothing sharp anywhere" },
  { word: "relaxed",      x: C[11], y: R[10], quadrant: "green", definition: "loose, easy, nothing tugging at you" },
  { word: "mellow",       x: C[6],  y: R[11], quadrant: "green", definition: "low and gentle, no edge to anything" },
  { word: "ok",           x: C[7],  y: R[11], quadrant: "green", definition: "not great, not bad — just steady" },
  { word: "content",      x: C[8],  y: R[11], quadrant: "green", definition: "quietly satisfied with how things are" },
  { word: "peaceful",     x: C[9],  y: R[11], quadrant: "green", definition: "settled, still, at rest inside" },
  { word: "tranquil",     x: C[10], y: R[11], quadrant: "green", definition: "deeply still, like a pond with no wind" },
  { word: "serene",       x: C[11], y: R[11], quadrant: "green", definition: "wide, clear stillness, all the way through" },
];

export const EMOTIONS: Emotion[] = RAW_EMOTIONS.map((e, i) => ({ id: i + 1, ...e }));

export const EMOTION_BY_ID: Record<number, Emotion> = Object.fromEntries(
  EMOTIONS.map((e) => [e.id, e])
);

export const EMOTION_BY_WORD: Record<string, Emotion> = Object.fromEntries(
  EMOTIONS.map((e) => [e.word, e])
);

const GRID_COLS = 12;
const GRID_ROWS = 12;

export const EMOTION_GRID = { cols: GRID_COLS, rows: GRID_ROWS };

function buildGridPositions(): Record<string, { col: number; row: number }> {
  const occupied = new Set<number>();
  const out: Record<string, { col: number; row: number }> = {};
  const key = (c: number, r: number) => r * GRID_COLS + c;

  for (const e of EMOTIONS) {
    const tc = Math.min(GRID_COLS - 1, Math.max(0, Math.round(e.x * (GRID_COLS - 1))));
    const tr = Math.min(GRID_ROWS - 1, Math.max(0, Math.round(e.y * (GRID_ROWS - 1))));

    let placed: { col: number; row: number } | null = null;
    for (let ring = 0; ring < GRID_COLS + GRID_ROWS && !placed; ring++) {
      let best: { col: number; row: number; d: number } | null = null;
      for (let dc = -ring; dc <= ring; dc++) {
        for (let dr = -ring; dr <= ring; dr++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue;
          const c = tc + dc;
          const r = tr + dr;
          if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) continue;
          if (occupied.has(key(c, r))) continue;
          const d = dc * dc + dr * dr;
          if (!best || d < best.d) best = { col: c, row: r, d };
        }
      }
      if (best) placed = { col: best.col, row: best.row };
    }

    if (placed) {
      occupied.add(key(placed.col, placed.row));
      out[e.word] = placed;
    }
  }
  return out;
}

export const EMOTION_GRID_POSITIONS = buildGridPositions();

export const QUADRANT_COLORS: Record<Quadrant, string> = {
  yellow: "#D9A94B",
  green: "#7BB191",
  blue: "#6D8FB9",
  red: "#C97A6E",
};

export const CONTEXT_TAG_OPTIONS = [
  "work",
  "family",
  "health",
  "relationships",
  "finances",
  "sleep",
  "exercise",
] as const;
