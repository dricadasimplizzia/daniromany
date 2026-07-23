import { Calendar, AlertTriangle, ClipboardList, Users, ShoppingCart, TrendingUp, TrendingDown, Stethoscope } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPacientesBasicoMap } from "@/lib/pacientes-basico";
import { Card } from "@/components/ui";
import { fmtDate, fmtMoney, todayISO } from "@/lib/format";
import type { AgendaItem, Compra, Paciente } from "@/lib/supabase/database.types";

export default async function PainelPage() {
  await requireProfile();
  const supabase = await createClient();
  const hoje = todayISO();
  const mesAtual = hoje.slice(0, 7);

  const [pacientesRes, agendaHojeRes, evolucoesHojeRes, comprasRes, nomesRes] = await Promise.all([
    supabase.from("pacientes").select("id,nome,vencimento,status_pagamento,status,proxima_avaliacao"),
    supabase.from("agenda").select("id,paciente_id,tipo,status,horario").eq("data", hoje),
    supabase.from("evolucoes").select("paciente_id").eq("data", hoje),
    supabase.from("compras").select("id,status,valor_estimado,valor_aprovado,data_solicitacao,data_compra"),
    getPacientesBasicoMap(),
  ]);

  const pacientes = (pacientesRes.data ?? []) as Pick<
    Paciente,
    "id" | "nome" | "vencimento" | "status_pagamento" | "status" | "proxima_avaliacao"
  >[];
  const agendaHoje = (agendaHojeRes.data ?? []) as Pick<AgendaItem, "id" | "paciente_id" | "tipo" | "status" | "horario">[];
  const evolucoesHoje = (evolucoesHojeRes.data ?? []) as { paciente_id: string }[];
  const compras = (comprasRes.data ?? []) as Pick<
    Compra,
    "id" | "status" | "valor_estimado" | "valor_aprovado" | "data_solicitacao" | "data_compra"
  >[];
  const nomes = nomesRes;

  const vencidos = pacientes.filter((p) => p.vencimento && p.vencimento < hoje && p.status_pagamento !== "pago" && p.status !== "inativo");
  const inativos = pacientes.filter((p) => p.status === "inativo");
  const avaliacaoProxima = pacientes.filter((p) => p.proxima_avaliacao && p.proxima_avaliacao <= hoje && p.status !== "inativo");

  // A evolução clínica (exigência do CREFITO) só se aplica a pilates/fisioterapia.
  const semEvolucao = agendaHoje.filter(
    (a) =>
      a.tipo !== "quiropraxia" &&
      a.status === "realizado" &&
      !evolucoesHoje.some((e) => e.paciente_id === a.paciente_id),
  );

  const comprasPendentes = compras.filter((c) => c.status === "Pendente" || c.status === "Alteração solicitada");
  const comprasAprovadas = compras.filter((c) => c.status === "Aprovado");
  const previstoMes = compras
    .filter((c) => c.data_solicitacao.startsWith(mesAtual) && !["Rejeitado", "Cancelado"].includes(c.status))
    .reduce((s, c) => s + Number(c.valor_aprovado ?? c.valor_estimado ?? 0), 0);
  const gastoMes = compras
    .filter((c) => c.data_compra && c.data_compra.startsWith(mesAtual))
    .reduce((s, c) => s + Number(c.valor_aprovado ?? c.valor_estimado ?? 0), 0);

  const stats = [
    { label: "Atendimentos hoje", value: String(agendaHoje.length), icon: Calendar, tone: "text-brass" },
    { label: "Mensalidades vencidas", value: String(vencidos.length), icon: AlertTriangle, tone: "text-brick" },
    { label: "Evoluções pendentes hoje", value: String(semEvolucao.length), icon: ClipboardList, tone: "text-teal" },
    { label: "Pacientes inativos", value: String(inativos.length), icon: Users, tone: "text-sage" },
    { label: "Compras aguardando aprovação", value: String(comprasPendentes.length), icon: ShoppingCart, tone: "text-brass" },
    { label: "Compras aprovadas", value: String(comprasAprovadas.length), icon: ShoppingCart, tone: "text-sage" },
    { label: "Previsto em compras (mês)", value: fmtMoney(previstoMes), icon: TrendingUp, tone: "text-brass" },
    { label: "Gasto em compras (mês)", value: fmtMoney(gastoMes), icon: TrendingDown, tone: "text-brick" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))" }}>
        {stats.map((s) => (
          <Card key={s.label} className="!p-[18px]">
            <div className="flex justify-between mb-2.5">
              <span className="text-xs text-ink-muted font-semibold">{s.label}</span>
              <s.icon size={16} className={s.tone} />
            </div>
            <div className="font-display text-[26px] text-ink">{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-2.5">
            <AlertTriangle size={16} className="text-brick" />
            <h3 className="font-display text-base m-0">Mensalidades vencidas / inadimplentes</h3>
          </div>
          {vencidos.length === 0 ? (
            <div className="text-[13px] text-ink-muted">Tudo em dia.</div>
          ) : (
            vencidos.map((p) => (
              <div key={p.id} className="text-[13.5px] py-1.5 flex justify-between">
                <span>{nomes.get(p.id) ?? p.nome}</span>
                <span className="text-brick font-semibold">desde {fmtDate(p.vencimento)}</span>
              </div>
            ))
          )}
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2.5">
            <Stethoscope size={16} className="text-teal" />
            <h3 className="font-display text-base m-0">Reavaliação necessária</h3>
          </div>
          {avaliacaoProxima.length === 0 ? (
            <div className="text-[13px] text-ink-muted">Nenhuma pendente.</div>
          ) : (
            avaliacaoProxima.map((p) => (
              <div key={p.id} className="text-[13.5px] py-1.5">
                {nomes.get(p.id) ?? p.nome} — prevista {fmtDate(p.proxima_avaliacao)}
              </div>
            ))
          )}
        </Card>
      </div>

      {semEvolucao.length > 0 && (
        <Card className="!border-brick">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={16} className="text-brick" />
            <h3 className="font-display text-base m-0">Evolução clínica não registrada hoje</h3>
          </div>
          {semEvolucao.map((a) => (
            <div key={a.id} className="text-[13.5px] py-1">
              {nomes.get(a.paciente_id) ?? "—"} — {a.horario}
            </div>
          ))}
          <div className="text-xs text-ink-muted mt-1.5">
            Exigência do CREFITO: todo atendimento realizado precisa de evolução correspondente.
          </div>
        </Card>
      )}
    </div>
  );
}
