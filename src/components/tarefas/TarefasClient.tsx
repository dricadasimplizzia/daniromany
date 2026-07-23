"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, Empty, Field, Input, Modal, Select, SectionTitle } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import type { Tarefa } from "@/lib/supabase/database.types";
import { createTarefa, deleteTarefa, updateStatusTarefa, type TarefaFormInput } from "@/app/(app)/tarefas/actions";
import type { TarefaComResponsavel } from "@/app/(app)/tarefas/page";

const PRIORIDADES: Tarefa["prioridade"][] = ["Baixa", "Média", "Alta"];
const STATUS_TAREFA: Tarefa["status"][] = ["Pendente", "Em andamento", "Concluída"];
const TONE_PRIORIDADE: Record<Tarefa["prioridade"], "sage" | "brass" | "brick"> = { Baixa: "sage", Média: "brass", Alta: "brick" };

export function TarefasClient({ tarefas, pessoas, profileId }: { tarefas: TarefaComResponsavel[]; pessoas: { id: string; nome: string }[]; profileId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<TarefaFormInput>({ titulo: "", responsavel_id: profileId, prazo: "", prioridade: "Média" });

  const ordenadas = useMemo(
    () =>
      [...tarefas].sort(
        (a, b) =>
          Number(a.status === "Concluída") - Number(b.status === "Concluída") ||
          (a.prazo || "9999").localeCompare(b.prazo || "9999"),
      ),
    [tarefas],
  );

  const salvar = () => {
    if (!form.titulo.trim()) return;
    startTransition(async () => {
      const res = await createTarefa(form);
      if (!res.error) {
        setForm({ titulo: "", responsavel_id: profileId, prazo: "", prioridade: "Média" });
        setModal(false);
        router.refresh();
      }
    });
  };

  const setStatus = (id: string, status: Tarefa["status"]) => {
    startTransition(async () => {
      await updateStatusTarefa(id, status);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteTarefa(id);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-[18px]">
        <SectionTitle>Tarefas</SectionTitle>
        <Button onClick={() => setModal(true)}>
          <Plus size={16} /> Nova tarefa
        </Button>
      </div>

      {tarefas.length === 0 && <Empty icon={ListChecks} text="Nenhuma tarefa cadastrada. Ex: consertar o Cadillac, renovar o alvará..." />}

      <div className="flex flex-col gap-2">
        {ordenadas.map((t) => (
          <Card key={t.id} className={`!p-3.5 ${t.status === "Concluída" ? "opacity-60" : ""}`}>
            <div className="flex justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm text-ink ${t.status === "Concluída" ? "line-through" : ""}`}>{t.titulo}</span>
                  <Badge tone={TONE_PRIORIDADE[t.prioridade]}>{t.prioridade}</Badge>
                </div>
                <div className="text-[12.5px] text-ink-muted mt-1">
                  {t.profiles?.nome ?? "—"} {t.prazo ? `· prazo ${fmtDate(t.prazo)}` : ""}
                </div>
              </div>
              <div className="flex gap-1.5 items-center">
                <Select value={t.status} onChange={(e) => setStatus(t.id, e.target.value as Tarefa["status"])} className="!w-36" disabled={pending}>
                  {STATUS_TAREFA.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                <Button variant="danger" small onClick={() => remove(t.id)} disabled={pending}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {modal && (
        <Modal title="Nova tarefa" onClose={() => setModal(false)}>
          <div className="flex flex-col gap-3.5">
            <Field label="O que precisa ser feito?">
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Agendar manutenção do ar-condicionado"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Responsável">
                <Select value={form.responsavel_id} onChange={(e) => setForm({ ...form, responsavel_id: e.target.value })}>
                  {pessoas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Prazo (opcional)">
                <Input type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
              </Field>
            </div>
            <Field label="Prioridade">
              <Select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value as TarefaFormInput["prioridade"] })}>
                {PRIORIDADES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={salvar} disabled={pending} className="justify-center">
              Salvar tarefa
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
