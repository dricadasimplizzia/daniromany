"use client";

import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";

const OPCOES = [
  { v: "agendaDia", label: "Agenda diária" },
  { v: "frequencia", label: "Frequência dos pacientes" },
  { v: "evolucoes", label: "Evoluções clínicas" },
  { v: "ativos", label: "Pacientes ativos" },
  { v: "inativos", label: "Pacientes inativos" },
  { v: "inadimplentes", label: "Inadimplentes" },
  { v: "caixa", label: "Caixa (entradas e saídas)" },
  { v: "comissao", label: "Comissão quiropraxia" },
];

export function RelatoriosControls({ tipo, data, mes }: { tipo: string; data: string; mes: string }) {
  const router = useRouter();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams({ tipo, data, mes });
    params.set(key, value);
    router.push(`/relatorios?${params.toString()}`);
  };

  return (
    <div className="flex gap-2.5 my-4 flex-wrap">
      <Select value={tipo} onChange={(e) => setParam("tipo", e.target.value)} className="!w-56">
        {OPCOES.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </Select>
      {tipo === "agendaDia" && <Input type="date" value={data} onChange={(e) => setParam("data", e.target.value)} className="!w-40" />}
      {(tipo === "caixa" || tipo === "comissao") && (
        <Input type="month" value={mes} onChange={(e) => setParam("mes", e.target.value)} className="!w-40" />
      )}
      <Button variant="ghost" onClick={() => window.print()}>
        <Printer size={15} /> Imprimir / PDF
      </Button>
    </div>
  );
}
