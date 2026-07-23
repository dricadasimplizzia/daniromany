"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, Empty, Field, Input, Modal, Select, SectionTitle, TextArea } from "@/components/ui";
import type { AgendaHistoricoItem, AgendaItem, AppRole } from "@/lib/supabase/database.types";
import { createAgendaItem, deleteAgendaItem, setConfirmacao, updateAgendaItem, updateCapacidade, type AgendaFormInput } from "@/app/(app)/agenda/actions";

const TIPOS: { v: AgendaItem["tipo"]; label: string; tone: "sage" | "teal" | "brass" }[] = [
  { v: "pilates", label: "Pilates", tone: "sage" },
  { v: "fisioterapia", label: "Fisioterapia", tone: "teal" },
  { v: "quiropraxia", label: "Quiropraxia", tone: "brass" },
];

type ItemComHistorico = AgendaItem & { agenda_historico: AgendaHistoricoItem[] };

const emptyForm = (data: string): AgendaFormInput => ({
  paciente_id: "",
  tipo: "pilates",
  data,
  horario: "08:00",
  status: "agendado",
  tem_reposicao: false,
  motivo_alteracao: "",
});

export function AgendaClient({
  dataFiltro,
  items,
  pacientes,
  capacidade,
  role,
}: {
  dataFiltro: string;
  items: ItemComHistorico[];
  pacientes: { id: string; nome: string }[];
  capacidade: { pilates: number; fisioterapia: number };
  role: AppRole;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<null | "new" | string>(null);
  const [form, setForm] = useState<AgendaFormInput>(emptyForm(dataFiltro));
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState(capacidade);

  const nomeDoPaciente = (id: string) => pacientes.find((p) => p.id === id)?.nome ?? "—";

  const contarNoHorario = (horario: string, tipo: string, excluirId: string | null) =>
    items.filter((a) => a.horario === horario && a.tipo === tipo && a.status !== "cancelado" && a.id !== excluirId).length;

  const openNew = () => {
    setForm(emptyForm(dataFiltro));
    setModal("new");
  };
  const openEdit = (item: ItemComHistorico) => {
    setForm({
      paciente_id: item.paciente_id,
      tipo: item.tipo,
      data: item.data,
      horario: item.horario,
      status: item.status,
      tem_reposicao: item.tem_reposicao,
      motivo_alteracao: item.motivo_alteracao ?? "",
    });
    setModal(item.id);
  };

  const save = () => {
    if (!form.paciente_id) return;
    startTransition(async () => {
      if (modal === "new") await createAgendaItem(form);
      else if (modal) await updateAgendaItem(modal, form);
      setModal(null);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteAgendaItem(id);
      router.refresh();
    });
  };

  const confirmar = (id: string, val: "confirmou" | "cancelou") => {
    startTransition(async () => {
      await setConfirmacao(id, val);
      router.refresh();
    });
  };

  const salvarConfig = () => {
    startTransition(async () => {
      await updateCapacidade(Number(config.pilates), Number(config.fisioterapia));
      setShowConfig(false);
      router.refresh();
    });
  };

  const limitePilates = capacidade.pilates || 6;
  const limiteFisio = capacidade.fisioterapia || 3;
  const excedeLimite =
    form.tipo !== "quiropraxia" &&
    contarNoHorario(form.horario, form.tipo, modal === "new" ? null : modal) >= (form.tipo === "pilates" ? limitePilates : limiteFisio);

  const historicoAtual = modal && modal !== "new" ? items.find((i) => i.id === modal)?.agenda_historico ?? [] : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-[18px] flex-wrap gap-2.5">
        <SectionTitle>Agenda</SectionTitle>
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={dataFiltro}
            onChange={(e) => router.push(`/agenda?data=${e.target.value}`)}
            className="!w-40"
          />
          {role === "proprietaria" && (
            <Button variant="ghost" small onClick={() => setShowConfig(true)}>
              Limites por horário
            </Button>
          )}
          <Button onClick={openNew}>
            <Plus size={16} /> Agendar
          </Button>
        </div>
      </div>

      {items.length === 0 && <Empty icon={Calendar} text="Nenhum atendimento nessa data." />}

      <div className="flex flex-col gap-2">
        {items.map((a) => {
          const t = TIPOS.find((t) => t.v === a.tipo)!;
          return (
            <Card key={a.id} className="!p-3.5">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Badge tone="brass">{a.horario.slice(0, 5)}</Badge>
                  <Badge tone={t.tone}>{t.label}</Badge>
                  <div>
                    <div className="font-semibold text-sm text-ink">{nomeDoPaciente(a.paciente_id)}</div>
                    <div className="text-xs text-ink-muted">
                      {a.status} {a.tem_reposicao ? "· tem direito a reposição" : ""} · confirmação: {a.confirmacao}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {a.confirmacao === "pendente" && (
                    <>
                      <Button variant="ghost" small onClick={() => confirmar(a.id, "confirmou")} disabled={pending}>
                        Confirmou
                      </Button>
                      <Button variant="ghost" small onClick={() => confirmar(a.id, "cancelou")} disabled={pending}>
                        Cancelou
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" small onClick={() => openEdit(a)}>
                    Editar
                  </Button>
                  <Button variant="danger" small onClick={() => remove(a.id)} disabled={pending}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Novo agendamento" : "Editar agendamento"} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3.5">
            <Field label="Paciente">
              <Select value={form.paciente_id} onChange={(e) => setForm({ ...form, paciente_id: e.target.value })}>
                <option value="">Selecione</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Tipo">
                <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as AgendaItem["tipo"] })}>
                  {TIPOS.map((t) => (
                    <option key={t.v} value={t.v}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Data">
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </Field>
              <Field label="Horário">
                <Input type="time" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} />
              </Field>
            </div>
            {excedeLimite && (
              <div className="bg-brick-soft text-brick px-3 py-2 rounded-lg text-[12.5px]">
                Esse horário já atingiu o limite configurado para {form.tipo}. Confirme se é um encaixe intencional.
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AgendaItem["status"] })}>
                  <option value="agendado">Agendado</option>
                  <option value="realizado">Realizado</option>
                  <option value="falta">Falta</option>
                  <option value="cancelado">Cancelado</option>
                </Select>
              </Field>
              <Field label="Tem direito à reposição?">
                <Select
                  value={form.tem_reposicao ? "sim" : "nao"}
                  onChange={(e) => setForm({ ...form, tem_reposicao: e.target.value === "sim" })}
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </Select>
              </Field>
            </div>
            <Field label="Motivo da alteração / cancelamento (se houver)">
              <TextArea value={form.motivo_alteracao} onChange={(e) => setForm({ ...form, motivo_alteracao: e.target.value })} />
            </Field>
            {modal !== "new" && historicoAtual.length > 0 && (
              <div>
                <div className="text-xs font-bold text-ink-muted mb-1">Histórico de alterações</div>
                <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto">
                  {historicoAtual.map((h) => (
                    <div key={h.id} className="text-xs text-ink-muted">
                      • {h.acao}
                      {h.motivo ? ` — ${h.motivo}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={save} disabled={pending} className="justify-center">
              Salvar agendamento
            </Button>
          </div>
        </Modal>
      )}

      {showConfig && (
        <Modal title="Limite de vagas por horário" onClose={() => setShowConfig(false)} width={380}>
          <div className="flex flex-col gap-3.5">
            <div className="text-[12.5px] text-ink-muted">
              Um limite geral por tipo, aplicado a qualquer horário.
            </div>
            <Field label="Vagas de Pilates por horário">
              <Input type="number" value={config.pilates} onChange={(e) => setConfig({ ...config, pilates: Number(e.target.value) })} />
            </Field>
            <Field label="Vagas de Fisioterapia por horário">
              <Input
                type="number"
                value={config.fisioterapia}
                onChange={(e) => setConfig({ ...config, fisioterapia: Number(e.target.value) })}
              />
            </Field>
            <Button onClick={salvarConfig} disabled={pending} className="justify-center">
              Salvar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
