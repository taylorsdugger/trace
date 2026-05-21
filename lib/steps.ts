export type StepStatus = "open" | "walked" | "let_rest";

export type Step = {
  id: string;
  title: string;
  notes_md: string | null;
  status: StepStatus;
  due_date: string | null; // YYYY-MM-DD, null = unplanted
  position: number;
  estimate: string | null;
  tag: string | null;
  walked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StepInput = {
  title: string;
  due_date?: string | null;
  estimate?: string | null;
  tag?: string | null;
  notes_md?: string | null;
};

export type StepPatch = Partial<
  Pick<Step, "title" | "status" | "due_date" | "position" | "estimate" | "tag" | "notes_md">
>;
