export type Quadrant = "yellow" | "green" | "blue" | "red";
export type Emotion = {
  word: string;
  valence: number;
  energy: number;
  quadrant: Quadrant;
  definition: string;
};

export const EMOTIONS: Emotion[] = [
  // yellow: pleasant + high energy
  { word: "joyful", valence: 9, energy: 9, quadrant: "yellow", definition: "lit up with happiness and delight" },
  { word: "excited", valence: 8, energy: 10, quadrant: "yellow", definition: "buzzing with eager anticipation" },
  { word: "energized", valence: 7, energy: 9, quadrant: "yellow", definition: "full of fuel and ready to go" },
  { word: "hopeful", valence: 7, energy: 7, quadrant: "yellow", definition: "trusting that good things are coming" },
  { word: "proud", valence: 8, energy: 7, quadrant: "yellow", definition: "warmed by something you did or are" },
  // green: pleasant + low energy
  { word: "calm", valence: 8, energy: 3, quadrant: "green", definition: "free of stress, agitation, and worry" },
  { word: "content", valence: 8, energy: 4, quadrant: "green", definition: "quietly satisfied with how things are" },
  { word: "peaceful", valence: 9, energy: 2, quadrant: "green", definition: "settled, still, at rest inside" },
  { word: "grateful", valence: 8, energy: 5, quadrant: "green", definition: "softly aware of what you've been given" },
  { word: "relaxed", valence: 7, energy: 3, quadrant: "green", definition: "loose, easy, nothing tugging at you" },
  // blue: unpleasant + low energy
  { word: "sad", valence: 2, energy: 3, quadrant: "blue", definition: "heavy with loss or disappointment" },
  { word: "drained", valence: 2, energy: 2, quadrant: "blue", definition: "empty, with nothing left to give" },
  { word: "lonely", valence: 2, energy: 4, quadrant: "blue", definition: "cut off, missing real connection" },
  { word: "discouraged", valence: 3, energy: 4, quadrant: "blue", definition: "losing faith that it'll work out" },
  { word: "bored", valence: 4, energy: 3, quadrant: "blue", definition: "restless and unstimulated" },
  // red: unpleasant + high energy
  { word: "anxious", valence: 3, energy: 8, quadrant: "red", definition: "keyed up about something that might go wrong" },
  { word: "angry", valence: 2, energy: 9, quadrant: "red", definition: "burning at something that feels unfair" },
  { word: "stressed", valence: 3, energy: 8, quadrant: "red", definition: "pulled tight by too many demands" },
  { word: "frustrated", valence: 3, energy: 7, quadrant: "red", definition: "blocked from something you want" },
  { word: "overwhelmed", valence: 2, energy: 8, quadrant: "red", definition: "more coming at you than you can hold" },
];

export const QUADRANT_COLORS: Record<Quadrant, string> = {
  yellow: "#D9A94B",
  green: "#7BB191",
  blue: "#6D8FB9",
  red: "#C97A6E",
};

export const QUADRANT_BG: Record<Quadrant, string> = {
  yellow: "rgba(217, 169, 75, 0.10)",
  green: "rgba(123, 177, 145, 0.10)",
  blue: "rgba(109, 143, 185, 0.10)",
  red: "rgba(201, 122, 110, 0.10)",
};

export const QUADRANT_LABEL: Record<Quadrant, { energy: string; valence: string; spoken: string }> = {
  blue: { energy: "LOW ENERGY", valence: "UNPLEASANT", spoken: "low energy · unpleasant" },
  red: { energy: "HIGH ENERGY", valence: "UNPLEASANT", spoken: "high energy · unpleasant" },
  green: { energy: "LOW ENERGY", valence: "PLEASANT", spoken: "low energy · pleasant" },
  yellow: { energy: "HIGH ENERGY", valence: "PLEASANT", spoken: "high energy · pleasant" },
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

export function quadrantFor(valence: number, energy: number): Quadrant {
  const pleasant = valence >= 5.5;
  const high = energy >= 5.5;
  if (pleasant && high) return "yellow";
  if (pleasant && !high) return "green";
  if (!pleasant && high) return "red";
  return "blue";
}
