"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type TipoMensagem = "confirmacao" | "lembrete" | "pagamento" | "avaliacao";

export async function enviarMensagem(pacienteId: string, tipo: TipoMensagem, contexto: string) {
  const profile = await requireProfile();
  if (!pacienteId) return { error: "Selecione o paciente." };

  const supabase = await createClient();
  const { data: paciente } = await supabase.from("pacientes_basico").select("nome").eq("id", pacienteId).maybeSingle();

  const { error } = await supabase.from("mensagens").insert({
    paciente_id: pacienteId,
    paciente_nome: paciente?.nome ?? null,
    tipo,
    contexto,
    created_by: profile.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/comunicacao");
  return { error: null };
}
