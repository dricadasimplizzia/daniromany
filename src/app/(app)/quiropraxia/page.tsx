import { requireAccess, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPacientesBasicoMap } from "@/lib/pacientes-basico";
import { todayISO } from "@/lib/format";
import { QuiropraxiaClient } from "@/components/quiropraxia/QuiropraxiaClient";
import type { QuiropraxiaAtendimento } from "@/lib/supabase/database.types";

export default async function QuiropraxiaPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const profile = await requireProfile();
  requireAccess(profile.role, "quiropraxia");
  const { mes: mesParam } = await searchParams;
  const mes = mesParam || todayISO().slice(0, 7);
  const [ano, mesNum] = mes.split("-").map(Number);
  const inicioMes = `${mes}-01`;
  const fimMes = new Date(ano, mesNum, 0).toISOString().slice(0, 10);

  const supabase = await createClient();
  const [atendimentosRes, nomes] = await Promise.all([
    supabase
      .from("quiropraxia_atendimentos")
      .select("*")
      .gte("data", inicioMes)
      .lte("data", fimMes)
      .order("data", { ascending: false }),
    getPacientesBasicoMap(),
  ]);

  return (
    <QuiropraxiaClient
      atendimentos={(atendimentosRes.data ?? []) as QuiropraxiaAtendimento[]}
      pacientes={[...nomes.entries()].map(([id, nome]) => ({ id, nome }))}
      mes={mes}
      role={profile.role}
    />
  );
}
