"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Check, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Button, Card, Empty, Field, Input, Modal, Select, SectionTitle } from "@/components/ui";
import { fmtDate, fmtMoney, todayISO } from "@/lib/format";
import { podeVerFinanceiroGeral } from "@/lib/nav";
import type { AppRole, CaixaItem, Paciente } from "@/lib/supabase/database.types";
import { createLancamento, deleteLancamento, marcarPago, type LancamentoInput } from "@/app/(app)/financeiro/actions";

const emptyForm: LancamentoInput = { tipo: "entrada", descricao: "", valor: 0, data: todayISO() };

export function FinanceiroClient({
  pacientes,
  caixa,
  mes,
  role,
}: {
  pacientes: Pick<Paciente, "id" | "nome" | "vencimento" | "valor_mensalidade" | "status_pagamento" | "status">[];
  caixa: CaixaItem[];
  mes: string;
  role: AppRole;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<LancamentoInput>(emptyForm);
  const podeVerGeral = podeVerFinanceiroGeral(role);

  const inadimplentes = useMemo(
    () => pacientes.filter((p) => p.vencimento && p.vencimento < todayISO() && p.status_pagamento !== "pago" && p.status !== "inativo"),
    [pacientes],
  );

  const entradas = caixa.filter((c) => c.tipo === "entrada").reduce((s, c) => s + Number(c.valor), 0);
  const saidas = caixa.filter((c) => c.tipo === "saida").reduce((s, c) => s + Number(c.valor), 0);

  const pagar = (id: string) => {
    startTransition(async () => {
      await marcarPago(id);
      router.refresh();
    });
  };

  const salvarLancamento = () => {
    startTransition(async () => {
      const res = await createLancamento(form);
      if (!res.error) {
        setForm(emptyForm);
        setModal(false);
        router.refresh();
      }
    });
  };

  const remover = (id: string) => {
    startTransition(async () => {
      await deleteLancamento(id);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-[18px] flex-wrap gap-2.5">
        <SectionTitle>Financeiro</SectionTitle>
        <div className="flex gap-2">
          {podeVerGeral && <Input type="month" value={mes} onChange={(e) => router.push(`/financeiro?mes=${e.target.value}`)} />}
          {podeVerGeral && (
            <Button onClick={() => { setForm(emptyForm); setModal(true); }}>
              <Plus size={16} /> Lançamento
            </Button>
          )}
        </div>
      </div>

      {!podeVerGeral && (
        <div className="bg-brass-soft text-brass px-3.5 py-2.5 rounded-[10px] text-[12.5px] mb-4">
          Lucro, saldo do caixa e lançamentos gerais são visíveis apenas para a proprietária. Aqui você acompanha e cobra as
          mensalidades pendentes.
        </div>
      )}

      <div className="grid gap-3.5 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
        {podeVerGeral && (
          <>
            <Card className="!p-4">
              <div className="text-xs text-ink-muted">Entradas</div>
              <div className="font-display text-[22px] text-sage">{fmtMoney(entradas)}</div>
            </Card>
            <Card className="!p-4">
              <div className="text-xs text-ink-muted">Saídas</div>
              <div className="font-display text-[22px] text-brick">{fmtMoney(saidas)}</div>
            </Card>
            <Card className="!p-4">
              <div className="text-xs text-ink-muted">Saldo</div>
              <div className="font-display text-[22px]">{fmtMoney(entradas - saidas)}</div>
            </Card>
          </>
        )}
        <Card className="!p-4">
          <div className="text-xs text-ink-muted">Inadimplentes</div>
          <div className="font-display text-[22px] text-brick">{inadimplentes.length}</div>
        </Card>
      </div>

      <div className="text-[13px] font-bold mb-2">Mensalidades pendentes</div>
      <div className="flex flex-col gap-2 mb-5">
        {inadimplentes.length === 0 && <div className="text-[13px] text-ink-muted">Nenhuma pendência.</div>}
        {inadimplentes.map((p) => (
          <Card key={p.id} className="!p-3 flex justify-between items-center flex-row">
            <div className="text-[13.5px]">
              {p.nome} — vencido em {fmtDate(p.vencimento)} · {fmtMoney(p.valor_mensalidade)}
            </div>
            <Button small onClick={() => pagar(p.id)} disabled={pending}>
              <Check size={14} /> Marcar pago
            </Button>
          </Card>
        ))}
      </div>

      {podeVerGeral && (
        <>
          <div className="text-[13px] font-bold mb-2">Caixa do mês</div>
          <div className="flex flex-col gap-2">
            {caixa.length === 0 && <Empty icon={Wallet} text="Nenhum lançamento neste mês." />}
            {caixa.map((c) => (
              <Card key={c.id} className="!p-3.5 flex justify-between items-center flex-row">
                <div className="flex items-center gap-2.5">
                  {c.tipo === "entrada" ? <TrendingUp size={16} className="text-sage" /> : <TrendingDown size={16} className="text-brick" />}
                  <div>
                    <div className="font-semibold text-sm">{c.descricao}</div>
                    <div className="text-xs text-ink-muted">{fmtDate(c.data)}</div>
                  </div>
                </div>
                <div className="flex gap-2.5 items-center">
                  <span className={`font-bold ${c.tipo === "entrada" ? "text-sage" : "text-brick"}`}>
                    {c.tipo === "entrada" ? "+" : "−"} {fmtMoney(c.valor)}
                  </span>
                  <Button variant="danger" small onClick={() => remover(c.id)} disabled={pending}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {modal && (
        <Modal title="Novo lançamento" onClose={() => setModal(false)}>
          <div className="flex flex-col gap-3.5">
            <Field label="Tipo">
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as "entrada" | "saida" })}>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </Select>
            </Field>
            <Field label="Descrição">
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor">
                <Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} />
              </Field>
              <Field label="Data">
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </Field>
            </div>
            <Button onClick={salvarLancamento} disabled={pending} className="justify-center">
              Salvar lançamento
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
