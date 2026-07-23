import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPacientesBasicoMap } from "@/lib/pacientes-basico";
import { todayISO } from "@/lib/format";
import { AgendaClient } from "@/components/agenda/AgendaClient";
import type { AgendaHistoricoItem, AgendaItem, CapacidadeHorario } from "@/lib/supabase/database.types";

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const profile = await requireProfile();
  const { data: dataParam } = await searchParams;
  const dataFiltro = dataParam || todayISO();

  const supabase = await createClient();

  const [agendaRes, capacidadeRes, nomes] = await Promise.all([
    supabase
      .from("agenda")
      .select("*, agenda_historico(*)")
      .eq("data", dataFiltro)
      .order("horario", { ascending: true }),
    supabase.from("capacidade_horarios").select("*"),
    getPacientesBasicoMap(),
  ]);

  const items = (agendaRes.data ?? []) as (AgendaItem & { agenda_historico: AgendaHistoricoItem[] })[];
  const capacidadeRows = (capacidadeRes.data ?? []) as CapacidadeHorario[];
  const capacidade = {
    pilates: capacidadeRows.find((c) => c.tipo === "pilates")?.limite ?? 6,
    fisioterapia: capacidadeRows.find((c) => c.tipo === "fisioterapia")?.limite ?? 3,
  };

  return (
    <AgendaClient
      dataFiltro={dataFiltro}
      items={items}
      pacientes={[...nomes.entries()].map(([id, nome]) => ({ id, nome }))}
      capacidade={capacidade}
      role={profile.role}
    />
  );
}
