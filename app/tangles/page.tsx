import { Suspense } from "react";
import { TanglesPicker } from "./TanglesPicker";

export const dynamic = "force-dynamic";

export default function TanglesPage() {
  return (
    <Suspense fallback={null}>
      <TanglesPicker />
    </Suspense>
  );
}
