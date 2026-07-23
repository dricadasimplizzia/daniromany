import type { BlocoSintoma } from "@/lib/supabase/database.types";

export function resumoSintoma(s: BlocoSintoma | null | undefined): string {
  if (!s) return "—";
  const partes: string[] = [];
  if (s.semIntercorrencias) partes.push("Sem intercorrências");
  if (s.higido) partes.push("Hígido");
  if (s.marcado) partes.push(`Quadro álgico (${(s.regioes || []).join(", ") || "sem região"})`);
  if (s.dorIrradiada) partes.push(`Dor irradiada (${(s.dorTipos || []).join(", ") || "—"})`);
  if (s.encurtamento) partes.push(`Encurtamento (${(s.cadeias || []).join(", ") || "—"})`);
  if (s.tontura) partes.push("Tontura");
  if (s.elevacaoPA) partes.push("Elevação P.A.");
  if (s.reducaoPA) partes.push("Redução P.A.");
  if (s.outros) partes.push(s.outros);
  return partes.join(" · ") || "—";
}
