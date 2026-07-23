"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Package, Plus, ShoppingCart } from "lucide-react";
import { Badge, Button, Card, Empty, Field, Input, Modal, Select, SectionTitle, TextArea } from "@/components/ui";
import { fmtDate, fmtMoney, todayISO } from "@/lib/format";
import { podeAprovarCompras } from "@/lib/nav";
import { CATEGORIAS_COMPRA, STATUS_BOLINHA, STATUS_TONE, URGENCIAS } from "@/lib/compras-constants";
import type { AppRole, EstoqueItem, StatusCompra } from "@/lib/supabase/database.types";
import {
  aprovarCompra,
  cancelarCompra,
  marcarCompraEntregue,
  marcarCompraRealizada,
  rejeitarCompra,
  solicitarAlteracaoCompra,
  solicitarCompra,
  type AprovacaoInput,
  type CompraFormInput,
} from "@/app/(app)/compras/actions";
import type { CompraComSolicitante } from "@/app/(app)/compras/page";
import { EstoqueModal } from "./EstoqueModal";

const emptyForm: CompraFormInput = {
  produto: "",
  categoria: "Consumo",
  quantidade: 1,
  valor_estimado: null,
  fornecedor: "",
  justificativa: "",
  urgencia: "Média",
};

export function ComprasClient({
  compras,
  estoque,
  role,
}: {
  compras: CompraComSolicitante[];
  estoque: EstoqueItem[];
  role: AppRole;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<null | "new" | string>(null);
  const [form, setForm] = useState<CompraFormInput>(emptyForm);
  const [aprovForm, setAprovForm] = useState<AprovacaoInput>({ valor_aprovado: null, fornecedor_escolhido: "", data_prevista: todayISO() });
  const [motivoAlteracao, setMotivoAlteracao] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusCompra | "todos">("todos");
  const [showEstoque, setShowEstoque] = useState(false);

  const podeAprovar = podeAprovarCompras(role);

  const grupos = useMemo(
    () => ({
      Pendentes: compras.filter((c) => c.status === "Pendente" || c.status === "Alteração solicitada"),
      Aprovadas: compras.filter((c) => c.status === "Aprovado"),
      Compradas: compras.filter((c) => c.status === "Comprado"),
    }),
    [compras],
  );

  const mesAtual = todayISO().slice(0, 7);
  const previstoMes = compras
    .filter((c) => c.data_solicitacao.startsWith(mesAtual) && !["Rejeitado", "Cancelado"].includes(c.status))
    .reduce((s, c) => s + Number(c.valor_aprovado ?? c.valor_estimado ?? 0), 0);
  const gastoMes = compras
    .filter((c) => c.data_compra && c.data_compra.startsWith(mesAtual))
    .reduce((s, c) => s + Number(c.valor_aprovado ?? c.valor_estimado ?? 0), 0);

  const listaVisivel = filtroStatus === "todos" ? compras : compras.filter((c) => c.status === filtroStatus);
  const compraModal = compras.find((c) => c.id === modal);

  const refresh = () => router.refresh();

  const enviarSolicitacao = () => {
    if (!form.produto.trim()) return;
    startTransition(async () => {
      const res = await solicitarCompra(form);
      if (!res.error) {
        setForm(emptyForm);
        setModal(null);
        refresh();
      }
    });
  };

  const abrirAprovacao = (c: CompraComSolicitante) => {
    setAprovForm({ valor_aprovado: c.valor_estimado, fornecedor_escolhido: c.fornecedor ?? "", data_prevista: todayISO() });
    setModal(c.id);
  };

  const aprovar = () => {
    if (!modal || modal === "new") return;
    startTransition(async () => {
      await aprovarCompra(modal, aprovForm);
      setModal(null);
      refresh();
    });
  };

  const solicitarAlteracao = () => {
    if (!modal || modal === "new") return;
    startTransition(async () => {
      await solicitarAlteracaoCompra(modal, motivoAlteracao);
      setMotivoAlteracao("");
      setModal(null);
      refresh();
    });
  };

  const acao = (fn: (id: string) => Promise<void>, id: string) => {
    startTransition(async () => {
      await fn(id);
      refresh();
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-[18px] flex-wrap gap-2.5">
        <SectionTitle>Compras &amp; Suprimentos</SectionTitle>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setShowEstoque(true)}>
            <Package size={16} /> Estoque
          </Button>
          <Button onClick={() => { setForm(emptyForm); setModal("new"); }}>
            <Plus size={16} /> Solicitar compra
          </Button>
        </div>
      </div>

      <div className="grid gap-3.5 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
        <Card className="!p-4">
          <div className="text-xs text-ink-muted">Aguardando aprovação</div>
          <div className="font-display text-[22px]">{grupos.Pendentes.length}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-xs text-ink-muted">Aprovadas</div>
          <div className="font-display text-[22px] text-sage">{grupos.Aprovadas.length}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-xs text-ink-muted">Previsto no mês</div>
          <div className="font-display text-[22px]">{fmtMoney(previstoMes)}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-xs text-ink-muted">Gasto no mês</div>
          <div className="font-display text-[22px] text-brick">{fmtMoney(gastoMes)}</div>
        </Card>
      </div>

      <div className="flex gap-2 mb-3.5 flex-wrap">
        <Button variant={filtroStatus === "todos" ? "primary" : "ghost"} small onClick={() => setFiltroStatus("todos")}>
          Todos
        </Button>
        <Button variant="ghost" small onClick={() => setFiltroStatus("Pendente")}>
          🟡 Pendentes ({grupos.Pendentes.length})
        </Button>
        <Button variant="ghost" small onClick={() => setFiltroStatus("Aprovado")}>
          🟢 Aprovadas ({grupos.Aprovadas.length})
        </Button>
        <Button variant="ghost" small onClick={() => setFiltroStatus("Comprado")}>
          🔵 Compradas ({grupos.Compradas.length})
        </Button>
      </div>

      {listaVisivel.length === 0 && <Empty icon={ShoppingCart} text="Nenhuma solicitação de compra por aqui." />}
      <div className="flex flex-col gap-2">
        {listaVisivel.map((c) => (
          <Card key={c.id} className="!p-3.5">
            <div className="flex justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[14.5px]">
                    {STATUS_BOLINHA[c.status]} {c.produto}
                  </span>
                  <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  <Badge tone="brass">{c.categoria}</Badge>
                </div>
                <div className="text-[12.5px] text-ink-muted mt-1">
                  {c.profiles?.nome ?? "—"} · {fmtDate(c.data_solicitacao)} · qtd {c.quantidade} · estimado {fmtMoney(c.valor_estimado)}{" "}
                  {c.valor_aprovado ? `· aprovado ${fmtMoney(c.valor_aprovado)}` : ""} · urgência {c.urgencia}
                </div>
                {c.justificativa && <div className="text-[12.5px] text-ink-muted mt-0.5 italic">{c.justificativa}</div>}
                {c.motivo_alteracao && <div className="text-[12.5px] text-brass mt-0.5">Alteração pedida: {c.motivo_alteracao}</div>}
              </div>
              {podeAprovar && (
                <div className="flex gap-1.5 flex-wrap items-start">
                  {c.status === "Pendente" && (
                    <>
                      <Button small onClick={() => abrirAprovacao(c)}>
                        Aprovar
                      </Button>
                      <Button variant="ghost" small onClick={() => setModal(c.id)}>
                        Pedir alteração
                      </Button>
                      <Button variant="danger" small onClick={() => acao(rejeitarCompra, c.id)} disabled={pending}>
                        Rejeitar
                      </Button>
                    </>
                  )}
                  {c.status === "Aprovado" && (
                    <Button small onClick={() => acao(marcarCompraRealizada, c.id)} disabled={pending}>
                      Compra realizada
                    </Button>
                  )}
                  {c.status === "Comprado" && (
                    <Button small onClick={() => acao(marcarCompraEntregue, c.id)} disabled={pending}>
                      Marcar entregue
                    </Button>
                  )}
                  {!["Cancelado", "Entregue", "Rejeitado"].includes(c.status) && (
                    <Button variant="ghost" small onClick={() => acao(cancelarCompra, c.id)} disabled={pending}>
                      Cancelar
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {modal === "new" && (
        <Modal title="Solicitar compra" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3.5">
            <Field label="Produto">
              <Input value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria">
                <Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as CompraFormInput["categoria"] })}>
                  {CATEGORIAS_COMPRA.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Urgência">
                <Select value={form.urgencia} onChange={(e) => setForm({ ...form, urgencia: e.target.value as CompraFormInput["urgencia"] })}>
                  {URGENCIAS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantidade">
                <Input type="number" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
              </Field>
              <Field label="Valor estimado">
                <Input
                  type="number"
                  value={form.valor_estimado ?? ""}
                  onChange={(e) => setForm({ ...form, valor_estimado: e.target.value ? Number(e.target.value) : null })}
                />
              </Field>
            </div>
            <Field label="Fornecedor (opcional)">
              <Input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
            </Field>
            <Field label="Justificativa">
              <TextArea value={form.justificativa} onChange={(e) => setForm({ ...form, justificativa: e.target.value })} />
            </Field>
            <Button onClick={enviarSolicitacao} disabled={pending} className="justify-center">
              Enviar solicitação
            </Button>
          </div>
        </Modal>
      )}

      {compraModal && compraModal.status === "Pendente" && (
        <Modal title={`Analisar: ${compraModal.produto}`} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3.5">
            <div className="text-[13px] text-ink-muted">{compraModal.justificativa}</div>
            <div className="text-[13px] font-bold">Aprovar com:</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor aprovado">
                <Input
                  type="number"
                  value={aprovForm.valor_aprovado ?? ""}
                  onChange={(e) => setAprovForm({ ...aprovForm, valor_aprovado: e.target.value ? Number(e.target.value) : null })}
                />
              </Field>
              <Field label="Data prevista da compra">
                <Input type="date" value={aprovForm.data_prevista} onChange={(e) => setAprovForm({ ...aprovForm, data_prevista: e.target.value })} />
              </Field>
            </div>
            <Field label="Fornecedor escolhido">
              <Input value={aprovForm.fornecedor_escolhido} onChange={(e) => setAprovForm({ ...aprovForm, fornecedor_escolhido: e.target.value })} />
            </Field>
            <Button onClick={aprovar} disabled={pending} className="justify-center">
              Aprovar solicitação
            </Button>
            <div className="h-px bg-border" />
            <Field label="Ou pedir alteração (motivo)">
              <TextArea value={motivoAlteracao} onChange={(e) => setMotivoAlteracao(e.target.value)} />
            </Field>
            <Button variant="ghost" onClick={solicitarAlteracao} disabled={pending} className="justify-center">
              Solicitar alteração ao solicitante
            </Button>
          </div>
        </Modal>
      )}

      {showEstoque && <EstoqueModal estoque={estoque} podeEditar={podeAprovar} onClose={() => setShowEstoque(false)} />}
    </div>
  );
}
