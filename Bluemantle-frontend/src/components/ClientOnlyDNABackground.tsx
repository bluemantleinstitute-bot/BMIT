"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// Lazy load with no loading state - just returns null until ready
const DNABackground = dynamic(
  () => import("./DNABackground").then((m) => m.DNABackground),
  { ssr: false }
);

export function ClientOnlyDNABackground() {
  return (
    <Suspense fallback={null}>
      <DNABackground />
    </Suspense>
  );
}
