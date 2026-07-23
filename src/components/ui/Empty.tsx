import type { LucideIcon } from "lucide-react";

export function Empty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="text-center py-11 px-5 text-ink-muted">
      <Icon size={26} strokeWidth={1.4} className="mb-2 opacity-60 mx-auto" />
      <div className="text-[13.5px]">{text}</div>
    </div>
  );
}
