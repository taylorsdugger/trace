import { Suspense } from "react";
import { NewEntry } from "./NewEntry";

export const dynamic = "force-dynamic";

export default function NewEntryPage() {
  return (
    <Suspense fallback={null}>
      <NewEntry />
    </Suspense>
  );
}
