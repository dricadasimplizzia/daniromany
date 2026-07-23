"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field, Input, Modal, Select, Button } from "@/components/ui";
import { todayISO } from "@/lib/format";
import type { AppRole, Paciente } from "@/lib/supabase/database.types";
import { createPaciente, updatePaciente, type PacienteFormInput } from "@/app/(app)/pacientes/actions";

function toFormInput(p: Paciente | null): PacienteFormInput {
  return {
    nome: p?.nome ?? "",
    cpf: p?.cpf ?? "",
    nascimento: p?.nascimento ?? "",
    telefone: p?.telefone ?? "",
    endereco: p?.endereco ?? "",
    profissao: p?.profissao ?? "",
    peso: p?.peso?.toString() ?? "",
    altura: p?.altura?.toString() ?? "",
    status: p?.status ?? "ativo",
    data_inativacao: p?.data_inativacao ?? "",
    autorizou_imagem: p?.autorizou_imagem ?? false,
    data_assinatura_imagem: p?.data_assinatura_imagem ?? "",
    valor_mensalidade: p?.valor_mensalidade?.toString() ?? "",
    vencimento: p?.vencimento ?? todayISO(),
    status_pagamento: p?.status_pagamento ?? "pendente",
    data_pagamento: p?.data_pagamento ?? "",
    forma_pagamento: p?.forma_pagamento ?? "",
    proxima_avaliacao: p?.proxima_avaliacao ?? "",
  };
}

export function PacienteFormModal({
  paciente,
  role,
  onClose,
}: {
  paciente: Paciente | null;
  role: AppRole;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<PacienteFormInput>(toFormInput(paciente));
  const [error, setError] = useState<string | null>(null);
  const podeEditarMensalidade = role === "proprietaria";

  const salvar = () => {
    if (!form.nome.trim()) return;
    startTransition(async () => {
      const res = paciente ? await updatePaciente(paciente.id, form) : await createPaciente(form);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <Modal title={paciente ? "Editar paciente" : "Novo paciente"} onClose={onClose}>
      <div className="flex flex-col gap-3.5">
        <Field label="Nome completo">
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CPF">
            <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
          </Field>
          <Field label="Data de nascimento">
            <Input type="date" value={form.nascimento} onChange={(e) => setForm({ ...form, nascimento: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone">
            <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </Field>
          <Field label="Profissão">
            <Input value={form.profissao} onChange={(e) => setForm({ ...form, profissao: e.target.value })} />
          </Field>
        </div>
        <Field label="Endereço">
          <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso (kg)">
            <Input type="number" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
          </Field>
          <Field label="Altura (cm)">
            <Input type="number" value={form.altura} onChange={(e) => setForm({ ...form, altura: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Situação">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "ativo" | "inativo" })}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </Select>
          </Field>
          {form.status === "inativo" && (
            <Field label="Data da inativação">
              <Input type="date" value={form.data_inativacao} onChange={(e) => setForm({ ...form, data_inativacao: e.target.value })} />
            </Field>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Autorizou uso de imagem?">
            <Select
              value={form.autorizou_imagem ? "sim" : "nao"}
              onChange={(e) => setForm({ ...form, autorizou_imagem: e.target.value === "sim" })}
            >
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </Select>
          </Field>
          {form.autorizou_imagem && (
            <Field label="Data da assinatura">
              <Input
                type="date"
                value={form.data_assinatura_imagem}
                onChange={(e) => setForm({ ...form, data_assinatura_imagem: e.target.value })}
              />
            </Field>
          )}
        </div>
        <div className="text-xs text-ink-muted">
          O termo assinado (PDF) pode ser anexado na aba Documentos, categoria &quot;Termos de uso de imagem&quot;.
        </div>

        <div className="h-px bg-border" />
        <div className="text-[13px] font-bold text-ink">Mensalidade</div>
        {!podeEditarMensalidade && (
          <div className="text-xs text-brass bg-brass-soft px-3 py-2 rounded-lg">
            Valor e desconto de mensalidade só podem ser alterados pela proprietária.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor">
            <Input
              type="number"
              value={form.valor_mensalidade}
              disabled={!podeEditarMensalidade}
              onChange={(e) => setForm({ ...form, valor_mensalidade: e.target.value })}
            />
          </Field>
          <Field label="Vencimento">
            <Input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Situação do pagamento">
            <Select
              value={form.status_pagamento}
              onChange={(e) => setForm({ ...form, status_pagamento: e.target.value as "pendente" | "pago" })}
            >
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
            </Select>
          </Field>
          <Field label="Forma de pagamento">
            <Input
              value={form.forma_pagamento}
              onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}
              placeholder="Pix, cartão..."
            />
          </Field>
        </div>
        <Field label="Próxima reavaliação (opcional)">
          <Input type="date" value={form.proxima_avaliacao} onChange={(e) => setForm({ ...form, proxima_avaliacao: e.target.value })} />
        </Field>

        {error && <div className="bg-brick-soft text-brick text-[12.5px] rounded-lg px-3 py-2">{error}</div>}

        <Button onClick={salvar} disabled={pending} className="justify-center">
          Salvar paciente
        </Button>
      </div>
    </Modal>
  );
}
