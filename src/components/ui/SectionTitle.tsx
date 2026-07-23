import type { ReactNode } from "react";
import { SpringDivider } from "./SpringDivider";

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-[22px] m-0 text-ink">{children}</h2>
      <SpringDivider width={64} />
    </div>
  );
}
