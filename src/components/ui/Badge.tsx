import type { ReactNode } from "react";

type Tone = "sage" | "brass" | "brick" | "teal";

const TONE_CLASS: Record<Tone, string> = {
  sage: "bg-sage-soft text-sage",
  brass: "bg-brass-soft text-brass",
  brick: "bg-brick-soft text-brick",
  teal: "bg-teal-soft text-teal",
};

export function Badge({ children, tone = "sage" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide whitespace-nowrap ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}
