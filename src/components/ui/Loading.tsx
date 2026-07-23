import { SpringDivider } from "./SpringDivider";

export function Loading() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-ink-muted">
      <SpringDivider width={80} />
      <span className="text-[13px]">Carregando...</span>
    </div>
  );
}
