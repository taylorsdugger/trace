import { Suspense } from "react";
import { NewTrace } from "./NewTrace";

export const dynamic = "force-dynamic";

export default function NewTracePage() {
  return (
    <Suspense fallback={null}>
      <NewTrace />
    </Suspense>
  );
}
