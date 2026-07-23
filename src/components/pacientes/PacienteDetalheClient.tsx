"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ClipboardList, Plus } from "lucide-react";
import { Badge, Button, Card, Empty, Field, Modal, SectionTitle, TextArea } from "@/components/ui";
import { fmtDate, fmtMoney, idade } from "@/lib/format";
import { resumoSintoma } from "@/lib/evolucao-format";
import { podeVerClinico } from "@/lib/nav";
import type { Anamnese, AppRole, Evolucao, Paciente } from "@/lib/supabase/database.types";
import { salvarAnamnese } from "@/app/(app)/pacientes/[id]/actions";
import { PacienteFormModal } from "./PacienteFormModal";
import { EvolucaoForm } from "./EvolucaoForm";

type Aba = "dados" | "anamnese" | "evolucoes" | "financeiro";

export function PacienteDetalheClient({
  paciente,
  anamnese,
  evolucoes,
  role,
}: {
  paciente: Paciente;
  anamnese: Anamnese | null;
  evolucoes: Evolucao[];
  role: AppRole;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [aba, setAba] = useState<Aba>("dados");
  const [editando, setEditando] = useState(false);
  const [novaEvolucao, setNovaEvolucao] = useState(false);
  const [textoAnamnese, setTextoAnamnese] = useState(anamnese?.texto ?? "");

  const clinico = podeVerClinico(role);

  const abas: { k: Aba; label: string }[] = [
    { k: "dados", label: "Dados pessoais" },
    ...(clinico ? ([{ k: "anamnese", label: "Anamnese" }, { k: "evolucoes", label: "Evoluções" }] as const) : []),
    { k: "financeiro", label: "Financeiro" },
  ];

  const salvarAnamneseHandler = () => {
    startTransition(async () => {
      await salvarAnamnese(paciente.id, textoAnamnese);
      router.refresh();
    });
  };

  return (
    <div>
      <Link href="/pacientes" className="flex items-center gap-1.5 text-ink-muted text-[13px] mb-3.5">
        <ArrowLeft size={15} /> Voltar
      </Link>

      <div className="flex justify-between items-start flex-wrap gap-2">
        <SectionTitle>{paciente.nome}</SectionTitle>
        <Button variant="ghost" small onClick={() => setEditando(true)}>
          Editar cadastro
        </Button>
      </div>

      <div className="flex gap-1 my-4 border-b border-border">
        {abas.map((a) => (
          <button
            key={a.k}
            onClick={() => setAba(a.k)}
            className={`bg-transparent border-none px-3 py-2.5 text-[13.5px] font-semibold cursor-pointer border-b-2 ${
              aba === a.k ? "text-sage border-sage" : "text-ink-muted border-transparent"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === "dados" && (
        <Card>
          <div className="grid sm:grid-cols-2 gap-3.5 text-sm">
            <div>
              <b>CPF:</b> {paciente.cpf || "—"}
            </div>
            <div>
              <b>Nascimento:</b> {fmtDate(paciente.nascimento)} ({idade(paciente.nascimento)} anos)
            </div>
            <div>
              <b>Telefone:</b> {paciente.telefone || "—"}
            </div>
            <div>
              <b>Profissão:</b> {paciente.profissao || "—"}
            </div>
            <div>
              <b>Endereço:</b> {paciente.endereco || "—"}
            </div>
            <div>
              <b>Peso/Altura:</b> {paciente.peso ?? "—"}kg / {paciente.altura ?? "—"}cm
            </div>
            <div>
              <b>Situação:</b> {paciente.status}
            </div>
            <div>
              <b>Uso de imagem:</b>{" "}
              {paciente.autorizou_imagem ? `Autorizado em ${fmtDate(paciente.data_assinatura_imagem)}` : "Não autorizado"}
            </div>
          </div>
        </Card>
      )}

      {aba === "anamnese" && clinico && (
        <Card>
          <Field label="Ficha de anamnese (histórico clínico do paciente)">
            <TextArea value={textoAnamnese} onChange={(e) => setTextoAnamnese(e.target.value)} className="!min-h-[200px]" />
          </Field>
          {anamnese && <div className="text-xs text-ink-muted mt-1.5">Última atualização: {fmtDate(anamnese.atualizado_em)}</div>}
          <Button onClick={salvarAnamneseHandler} disabled={pending} className="mt-3">
            Salvar anamnese
          </Button>
        </Card>
      )}

      {aba === "evolucoes" && clinico && (
        <div>
          <div className="flex justify-end mb-3">
            <Button onClick={() => setNovaEvolucao(true)}>
              <Plus size={16} /> Nova evolução
            </Button>
          </div>
          {evolucoes.length === 0 && <Empty icon={ClipboardList} text="Nenhuma evolução registrada ainda." />}
          <div className="flex flex-col gap-2.5">
            {evolucoes.map((e) => (
              <Card key={e.id} className="!p-3.5">
                <div className="flex justify-between">
                  <b className="text-sm">{fmtDate(e.data)}</b>
                  <span className="text-xs text-ink-muted">
                    {e.profissional_nome} {e.crefito}
                  </span>
                </div>
                <div className="text-[12.5px] text-ink-muted mt-1.5 leading-relaxed">
                  {e.sinais_vitais?.aferido === "sim" && (
                    <>
                      Sinais vitais: PA {e.sinais_vitais.pa || "—"} · FC {e.sinais_vitais.fc || "—"}
                      <br />
                    </>
                  )}
                  Pré: {resumoSintoma(e.pre)} <br />
                  Intercorrências: {resumoSintoma(e.intercorrencias)} <br />
                  Pós: {resumoSintoma(e.pos)} <br />
                  Aparelhos: {(e.aparelhos || []).join(", ") || "—"} · Acessórios: {(e.acessorios || []).join(", ") || "—"}
                </div>
                {e.observacoes && <div className="text-[12.5px] mt-1.5 italic">{e.observacoes}</div>}
              </Card>
            ))}
          </div>
          {novaEvolucao && (
            <Modal title="Nova evolução clínica" onClose={() => setNovaEvolucao(false)} width={640}>
              <EvolucaoForm
                pacienteId={paciente.id}
                onSaved={() => {
                  setNovaEvolucao(false);
                  router.refresh();
                }}
                onCancel={() => setNovaEvolucao(false)}
              />
            </Modal>
          )}
        </div>
      )}

      {aba === "financeiro" && (
        <Card>
          <div className="grid sm:grid-cols-2 gap-3.5 text-sm">
            <div>
              <b>Mensalidade:</b> {fmtMoney(paciente.valor_mensalidade)}
            </div>
            <div>
              <b>Vencimento:</b> {fmtDate(paciente.vencimento)}
            </div>
            <div>
              <b>Situação:</b> <Badge tone={paciente.status_pagamento === "pago" ? "sage" : "brick"}>{paciente.status_pagamento}</Badge>
            </div>
            <div>
              <b>Forma de pagamento:</b> {paciente.forma_pagamento || "—"}
            </div>
          </div>
        </Card>
      )}

      {editando && (
        <PacienteFormModal
          paciente={paciente}
          role={role}
          onClose={() => {
            setEditando(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
