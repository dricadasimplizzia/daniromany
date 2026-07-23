"use client";

import { Clock as ClockIcon } from "lucide-react";

export function Clock() {
  const label = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div suppressHydrationWarning className="text-[13px] text-ink-muted flex items-center gap-1.5">
      <ClockIcon size={14} />
      {label}
    </div>
  );
}
