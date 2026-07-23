"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { Badge, Button, Card, Empty, Input, SectionTitle } from "@/components/ui";
import { fmtMoney, idade, todayISO } from "@/lib/format";
import type { AppRole, Paciente } from "@/lib/supabase/database.types";
import { deletePaciente } from "@/app/(app)/pacientes/actions";
import { PacienteFormModal } from "./PacienteFormModal";

export function PacientesListClient({ pacientes, role }: { pacientes: Paciente[]; role: AppRole }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filtro, setFiltro] = useState("");
  const [modal, setModal] = useState<null | "new" | Paciente>(null);

  const listaFiltrada = useMemo(
    () => pacientes.filter((p) => p.nome.toLowerCase().includes(filtro.toLowerCase())),
    [pacientes, filtro],
  );

  const remove = (id: string) => {
    startTransition(async () => {
      await deletePaciente(id);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-[18px] flex-wrap gap-2.5">
        <SectionTitle>Pacientes</SectionTitle>
        <div className="flex gap-2.5">
          <Input placeholder="Buscar..." value={filtro} onChange={(e) => setFiltro(e.target.value)} className="!w-44" />
          <Button onClick={() => setModal("new")}>
            <Plus size={16} /> Novo paciente
          </Button>
        </div>
      </div>

      {listaFiltrada.length === 0 && <Empty icon={Users} text="Nenhum paciente cadastrado ainda." />}

      <div className="flex flex-col gap-2.5">
        {listaFiltrada.map((p) => {
          const vencido = !!p.vencimento && p.vencimento < todayISO() && p.status_pagamento !== "pago" && p.status !== "inativo";
          return (
            <Card key={p.id} className="!p-4">
              <div className="flex justify-between flex-wrap gap-2.5">
                <Link href={`/pacientes/${p.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[15px] text-ink">{p.nome}</span>
                    {p.status === "inativo" && <Badge tone="brick">Inativo</Badge>}
                    {vencido && <Badge tone="brick">Vencido</Badge>}
                  </div>
                  <div className="text-[12.5px] text-ink-muted mt-1">
                    {idade(p.nascimento)} anos · {p.telefone || "sem telefone"} · mensalidade {fmtMoney(p.valor_mensalidade)}
                  </div>
                </Link>
                <div className="flex gap-1.5">
                  <Button variant="ghost" small onClick={() => setModal(p)}>
                    Editar
                  </Button>
                  <Button variant="danger" small onClick={() => remove(p.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {modal && (
        <PacienteFormModal paciente={modal === "new" ? null : modal} role={role} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
