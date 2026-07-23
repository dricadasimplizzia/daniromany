import { requireAccess, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPacientesBasicoMap } from "@/lib/pacientes-basico";
import { todayISO } from "@/lib/format";
import { ComunicacaoClient } from "@/components/comunicacao/ComunicacaoClient";
import type { AgendaItem, Mensagem } from "@/lib/supabase/database.types";

export default async function ComunicacaoPage() {
  const profile = await requireProfile();
  requireAccess(profile.role, "comunicacao");

  const supabase = await createClient();
  const hoje = todayISO();

  const [agendaRes, mensagensRes, nomes] = await Promise.all([
    supabase
      .from("agenda")
      .select("id,paciente_id,data,horario")
      .gte("data", hoje)
      .eq("confirmacao", "pendente")
      .eq("status", "agendado")
      .order("data", { ascending: true }),
    supabase.from("mensagens").select("*").order("data", { ascending: false }).limit(30),
    getPacientesBasicoMap(),
  ]);

  return (
    <ComunicacaoClient
      proximos={(agendaRes.data ?? []) as Pick<AgendaItem, "id" | "paciente_id" | "data" | "horario">[]}
      mensagens={(mensagensRes.data ?? []) as Mensagem[]}
      pacientes={[...nomes.entries()].map(([id, nome]) => ({ id, nome }))}
    />
  );
}
