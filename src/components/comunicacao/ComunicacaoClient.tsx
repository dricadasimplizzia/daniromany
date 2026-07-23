"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { Button, Card, Empty, Select, SectionTitle } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import type { AgendaItem, Mensagem } from "@/lib/supabase/database.types";
import { enviarMensagem, type TipoMensagem } from "@/app/(app)/comunicacao/actions";

export function ComunicacaoClient({
  proximos,
  mensagens,
  pacientes,
}: {
  proximos: Pick<AgendaItem, "id" | "paciente_id" | "data" | "horario">[];
  mensagens: Mensagem[];
  pacientes: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pacienteId, setPacienteId] = useState("");
  const [tipo, setTipo] = useState<TipoMensagem>("lembrete");

  const nomeDoPaciente = (id: string) => pacientes.find((p) => p.id === id)?.nome ?? "—";

  const enviar = (pid: string, t: TipoMensagem, contexto: string) => {
    startTransition(async () => {
      await enviarMensagem(pid, t, contexto);
      router.refresh();
    });
  };

  const enviarManual = () => {
    if (!pacienteId) return;
    enviar(pacienteId, tipo, "Envio manual");
    setPacienteId("");
  };

  return (
    <div>
      <SectionTitle>Comunicação</SectionTitle>
      <div className="text-[12.5px] text-ink-muted my-2 mb-[18px]">
        Envio simulado: aqui só registramos que a mensagem foi enviada. Integração real com WhatsApp/SMS fica para uma
        próxima etapa.
      </div>

      <Card className="mb-5">
        <div className="text-[13px] font-bold mb-2.5">Enviar mensagem</div>
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "2fr 1fr auto" }}>
          <Select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)}>
            <option value="">Selecione o paciente</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoMensagem)}>
            <option value="confirmacao">Confirmação de consulta</option>
            <option value="lembrete">Lembrete de atendimento</option>
            <option value="pagamento">Aviso de pagamento</option>
            <option value="avaliacao">Aviso de nova avaliação</option>
          </Select>
          <Button onClick={enviarManual} disabled={pending}>
            Enviar
          </Button>
        </div>
      </Card>

      <div className="text-[13px] font-bold mb-2">Confirmações pendentes (próximos atendimentos)</div>
      <div className="flex flex-col gap-2 mb-5">
        {proximos.length === 0 && <div className="text-[13px] text-ink-muted">Nenhuma pendência.</div>}
        {proximos.map((a) => (
          <Card key={a.id} className="!p-3 flex justify-between items-center flex-row">
            <div className="text-[13.5px]">
              {nomeDoPaciente(a.paciente_id)} — {fmtDate(a.data)} {a.horario.slice(0, 5)}
            </div>
            <Button small onClick={() => enviar(a.paciente_id, "confirmacao", "Confirmação automática de agendamento")} disabled={pending}>
              Enviar lembrete
            </Button>
          </Card>
        ))}
      </div>

      <div className="text-[13px] font-bold mb-2">Histórico de envios</div>
      <div className="flex flex-col gap-1.5">
        {mensagens.length === 0 && <Empty icon={MessageCircle} text="Nenhuma mensagem enviada ainda." />}
        {mensagens.map((m) => (
          <div key={m.id} className="text-[12.5px] text-ink-muted py-1 border-b border-border">
            {new Date(m.data).toLocaleString("pt-BR")} · {m.paciente_nome} · {m.tipo} — {m.contexto}
          </div>
        ))}
      </div>
    </div>
  );
}
