export type Trap = {
  slug: string;
  name: string;
  desc: string;
  icon: string;
};

export const TRAPS: Trap[] = [
  { slug: "mind-reading", name: "Mind reading", desc: "assuming what others think", icon: "☁" },
  { slug: "catastrophizing", name: "Catastrophizing", desc: "jumping to worst case", icon: "⚡" },
  { slug: "all-or-nothing", name: "All-or-nothing", desc: "either / or thinking", icon: "◐" },
  { slug: "should", name: "Should statements", desc: "self-criticism via rules", icon: "!" },
  { slug: "fortune-telling", name: "Fortune telling", desc: "predicting the future", icon: "◇" },
  { slug: "personalization", name: "Personalization", desc: "blaming yourself", icon: "◉" },
  { slug: "unfair-compare", name: "Unfair compare", desc: "measuring against unfair", icon: "⚖" },
  { slug: "emotional-reasoning", name: "Emotional reasoning", desc: "feel it = it's true", icon: "♡" },
];
