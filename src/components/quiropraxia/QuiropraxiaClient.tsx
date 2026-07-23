"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Stethoscope, Trash2 } from "lucide-react";
import { Button, Card, Empty, Field, Input, Modal, Select, SectionTitle } from "@/components/ui";
import { fmtDate, fmtMoney, todayISO } from "@/lib/format";
import type { AppRole, QuiropraxiaAtendimento } from "@/lib/supabase/database.types";
import { createAtendimentoQuiropraxia, deleteAtendimentoQuiropraxia, type QuiropraxiaFormInput } from "@/app/(app)/quiropraxia/actions";

const emptyForm: QuiropraxiaFormInput = { paciente_id: "", data: todayISO(), valor_pago: 0 };

export function QuiropraxiaClient({
  atendimentos,
  pacientes,
  mes,
  role,
}: {
  atendimentos: QuiropraxiaAtendimento[];
  pacientes: { id: string; nome: string }[];
  mes: string;
  role: AppRole;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<QuiropraxiaFormInput>(emptyForm);

  const nomeDoPaciente = (id: string) => pacientes.find((p) => p.id === id)?.nome ?? "—";

  const totalPago = atendimentos.reduce((s, a) => s + Number(a.valor_pago), 0);
  const totalComissao = atendimentos.reduce((s, a) => s + Number(a.comissao_profissional), 0);
  const totalStudio = atendimentos.reduce((s, a) => s + Number(a.valor_studio), 0);

  const salvar = () => {
    startTransition(async () => {
      const res = await createAtendimentoQuiropraxia(form);
      if (!res.error) {
        setForm(emptyForm);
        setModal(false);
        router.refresh();
      }
    });
  };

  const remover = (id: string) => {
    startTransition(async () => {
      await deleteAtendimentoQuiropraxia(id);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-[18px] flex-wrap gap-2.5">
        <SectionTitle>Quiropraxia</SectionTitle>
        <div className="flex gap-2">
          <Input type="month" value={mes} onChange={(e) => router.push(`/quiropraxia?mes=${e.target.value}`)} />
          <Button onClick={() => { setForm(emptyForm); setModal(true); }}>
            <Plus size={16} /> Registrar atendimento
          </Button>
        </div>
      </div>

      <div className="grid gap-3.5 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
        <Card className="!p-4">
          <div className="text-xs text-ink-muted">Total recebido</div>
          <div className="font-display text-[22px]">{fmtMoney(totalPago)}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-xs text-ink-muted">Comissão do profissional</div>
          <div className="font-display text-[22px] text-brass">{fmtMoney(totalComissao)}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-xs text-ink-muted">Líquido Studio</div>
          <div className="font-display text-[22px] text-sage">{fmtMoney(totalStudio)}</div>
        </Card>
      </div>

      {atendimentos.length === 0 && <Empty icon={Stethoscope} text="Nenhum atendimento registrado neste mês." />}
      <div className="flex flex-col gap-2">
        {atendimentos.map((a) => (
          <Card key={a.id} className="!p-3.5 flex justify-between items-center flex-wrap gap-2">
            <div>
              <div className="font-semibold text-sm">{nomeDoPaciente(a.paciente_id)}</div>
              <div className="text-xs text-ink-muted">
                {fmtDate(a.data)} · pago {fmtMoney(a.valor_pago)} · comissão {fmtMoney(a.comissao_profissional)} · studio{" "}
                {fmtMoney(a.valor_studio)}
              </div>
            </div>
            {role === "proprietaria" && (
              <Button variant="danger" small onClick={() => remover(a.id)} disabled={pending}>
                <Trash2 size={14} />
              </Button>
            )}
          </Card>
        ))}
      </div>

      {modal && (
        <Modal title="Registrar atendimento de quiropraxia" onClose={() => setModal(false)}>
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data">
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </Field>
              <Field label="Valor pago">
                <Input type="number" value={form.valor_pago} onChange={(e) => setForm({ ...form, valor_pago: Number(e.target.value) })} />
              </Field>
            </div>
            {form.valor_pago > 0 && (
              <div className="text-[12.5px] text-ink-muted">
                Comissão (30%): {fmtMoney(form.valor_pago * 0.3)} · Studio (70%): {fmtMoney(form.valor_pago * 0.7)}
              </div>
            )}
            <Button onClick={salvar} disabled={pending} className="justify-center">
              Salvar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
