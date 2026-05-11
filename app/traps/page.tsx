import { Suspense } from "react";
import { TrapsPicker } from "./TrapsPicker";

export const dynamic = "force-dynamic";

export default function TrapsPage() {
  return (
    <Suspense fallback={null}>
      <TrapsPicker />
    </Suspense>
  );
}
