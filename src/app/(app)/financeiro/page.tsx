import { requireAccess, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";
import { FinanceiroClient } from "@/components/financeiro/FinanceiroClient";
import type { CaixaItem, Paciente } from "@/lib/supabase/database.types";

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const profile = await requireProfile();
  requireAccess(profile.role, "financeiro");
  const { mes: mesParam } = await searchParams;
  const mes = mesParam || todayISO().slice(0, 7);
  const [ano, mesNum] = mes.split("-").map(Number);
  const inicioMes = `${mes}-01`;
  const fimMes = new Date(ano, mesNum, 0).toISOString().slice(0, 10);

  const supabase = await createClient();
  const [pacientesRes, caixaRes] = await Promise.all([
    supabase.from("pacientes").select("id,nome,vencimento,valor_mensalidade,status_pagamento,status"),
    supabase.from("caixa").select("*").gte("data", inicioMes).lte("data", fimMes).order("data", { ascending: false }),
  ]);

  const pacientes = (pacientesRes.data ?? []) as Pick<
    Paciente,
    "id" | "nome" | "vencimento" | "valor_mensalidade" | "status_pagamento" | "status"
  >[];
  const caixa = (caixaRes.data ?? []) as CaixaItem[];

  return <FinanceiroClient pacientes={pacientes} caixa={caixa} mes={mes} role={profile.role} />;
}
