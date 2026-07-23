import { requireAccess, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPacientesBasicoMap } from "@/lib/pacientes-basico";
import { Card, Empty, SectionTitle } from "@/components/ui";
import { RelatoriosControls } from "@/components/relatorios/RelatoriosControls";
import { fmtDate, fmtMoney, todayISO } from "@/lib/format";
import { FileText } from "lucide-react";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; data?: string; mes?: string }>;
}) {
  const profile = await requireProfile();
  requireAccess(profile.role, "relatorios");

  const sp = await searchParams;
  const tipo = sp.tipo || "agendaDia";
  const data = sp.data || todayISO();
  const mes = sp.mes || todayISO().slice(0, 7);
  const [ano, mesNum] = mes.split("-").map(Number);
  const inicioMes = `${mes}-01`;
  const fimMes = new Date(ano, mesNum, 0).toISOString().slice(0, 10);

  const supabase = await createClient();
  let linhas: { key: string; texto: string }[] = [];
  let rodape: string | null = null;

  if (tipo === "agendaDia") {
    const [{ data: agenda }, nomes] = await Promise.all([
      supabase.from("agenda").select("id,paciente_id,horario,tipo,status").eq("data", data).order("horario"),
      getPacientesBasicoMap(),
    ]);
    linhas = (agenda ?? []).map((a) => ({
      key: a.id,
      texto: `${a.horario.slice(0, 5)} — ${nomes.get(a.paciente_id) ?? "—"} (${a.tipo}) — ${a.status}`,
    }));
  } else if (tipo === "frequencia") {
    const [{ data: agenda }, nomes] = await Promise.all([supabase.from("agenda").select("paciente_id"), getPacientesBasicoMap()]);
    const contagem = new Map<string, number>();
    (agenda ?? []).forEach((a) => contagem.set(a.paciente_id, (contagem.get(a.paciente_id) ?? 0) + 1));
    linhas = [...contagem.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, n]) => ({ key: id, texto: `${nomes.get(id) ?? "—"} — ${n} atendimento(s)` }));
  } else if (tipo === "evolucoes") {
    const [{ data: evolucoes }, nomes] = await Promise.all([
      supabase.from("evolucoes").select("id,paciente_id,data,profissional_nome").order("data", { ascending: false }),
      getPacientesBasicoMap(),
    ]);
    linhas = (evolucoes ?? []).map((e) => ({
      key: e.id,
      texto: `${fmtDate(e.data)} — ${nomes.get(e.paciente_id) ?? "—"} — ${e.profissional_nome}`,
    }));
  } else if (tipo === "ativos" || tipo === "inativos") {
    const { data: pacientes } = await supabase
      .from("pacientes")
      .select("id,nome,status")
      .eq("status", tipo === "ativos" ? "ativo" : "inativo")
      .order("nome");
    linhas = (pacientes ?? []).map((p) => ({ key: p.id, texto: p.nome }));
  } else if (tipo === "inadimplentes") {
    const { data: pacientes } = await supabase
      .from("pacientes")
      .select("id,nome,vencimento,valor_mensalidade,status_pagamento")
      .lt("vencimento", todayISO())
      .neq("status_pagamento", "pago");
    linhas = (pacientes ?? []).map((p) => ({
      key: p.id,
      texto: `${p.nome} — vencido ${fmtDate(p.vencimento)} — ${fmtMoney(p.valor_mensalidade)}`,
    }));
  } else if (tipo === "caixa") {
    const { data: caixa } = await supabase.from("caixa").select("*").gte("data", inicioMes).lte("data", fimMes).order("data");
    linhas = (caixa ?? []).map((c) => ({ key: c.id, texto: `${fmtDate(c.data)} — ${c.tipo} — ${c.descricao} — ${fmtMoney(c.valor)}` }));
  } else if (tipo === "comissao") {
    const [{ data: atendimentos }, nomes] = await Promise.all([
      supabase.from("quiropraxia_atendimentos").select("*").gte("data", inicioMes).lte("data", fimMes).order("data"),
      getPacientesBasicoMap(),
    ]);
    linhas = (atendimentos ?? []).map((a) => ({
      key: a.id,
      texto: `${fmtDate(a.data)} — ${nomes.get(a.paciente_id) ?? "—"} — comissão ${fmtMoney(a.comissao_profissional)}`,
    }));
    const total = (atendimentos ?? []).reduce((s, a) => s + Number(a.comissao_profissional), 0);
    rodape = `Total do mês: ${fmtMoney(total)}`;
  }

  return (
    <div>
      <SectionTitle>Relatórios</SectionTitle>
      <RelatoriosControls tipo={tipo} data={data} mes={mes} />
      <Card>
        {linhas.length === 0 ? (
          <Empty icon={FileText} text="Sem dados para esse filtro." />
        ) : (
          <>
            {linhas.map((l) => (
              <div key={l.key} className="text-[13.5px] py-1">
                {l.texto}
              </div>
            ))}
            {rodape && <div className="mt-2.5 font-bold text-sm">{rodape}</div>}
          </>
        )}
      </Card>
    </div>
  );
}
