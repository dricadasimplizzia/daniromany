"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export interface AgendaFormInput {
  paciente_id: string;
  tipo: "pilates" | "fisioterapia" | "quiropraxia";
  data: string;
  horario: string;
  status: "agendado" | "realizado" | "falta" | "cancelado";
  tem_reposicao: boolean;
  motivo_alteracao: string;
}

export async function createAgendaItem(input: AgendaFormInput) {
  await requireProfile();
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("agenda")
    .insert({
      paciente_id: input.paciente_id,
      tipo: input.tipo,
      data: input.data,
      horario: input.horario,
      status: input.status,
      tem_reposicao: input.tem_reposicao,
      motivo_alteracao: input.motivo_alteracao || null,
    })
    .select("id")
    .single();

  if (error || !created) return { error: error?.message ?? "Não foi possível criar o agendamento." };

  await supabase.from("agenda_historico").insert({ agenda_id: created.id, acao: "Criado" });

  revalidatePath("/agenda");
  return { error: null };
}

export async function updateAgendaItem(id: string, input: AgendaFormInput) {
  await requireProfile();
  const supabase = await createClient();

  const { data: anterior } = await supabase.from("agenda").select("data,horario,status").eq("id", id).single();

  const { error } = await supabase
    .from("agenda")
    .update({
      paciente_id: input.paciente_id,
      tipo: input.tipo,
      data: input.data,
      horario: input.horario,
      status: input.status,
      tem_reposicao: input.tem_reposicao,
      motivo_alteracao: input.motivo_alteracao || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (anterior) {
    const historicoEntries: { agenda_id: string; acao: string; motivo: string | null }[] = [];
    if (anterior.data !== input.data || anterior.horario !== input.horario) {
      historicoEntries.push({
        agenda_id: id,
        acao: `Remarcado de ${anterior.data} ${anterior.horario} para ${input.data} ${input.horario}`,
        motivo: input.motivo_alteracao || null,
      });
    }
    if (anterior.status !== input.status) {
      historicoEntries.push({ agenda_id: id, acao: `Status alterado para ${input.status}`, motivo: input.motivo_alteracao || null });
    }
    if (historicoEntries.length > 0) {
      await supabase.from("agenda_historico").insert(historicoEntries);
    }
  }

  revalidatePath("/agenda");
  return { error: null };
}

export async function deleteAgendaItem(id: string) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("agenda").delete().eq("id", id);
  revalidatePath("/agenda");
}

export async function setConfirmacao(id: string, confirmacao: "confirmou" | "cancelou") {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("agenda").update({ confirmacao }).eq("id", id);
  revalidatePath("/agenda");
}

export async function updateCapacidade(pilates: number, fisioterapia: number) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("capacidade_horarios").update({ limite: pilates }).eq("tipo", "pilates");
  await supabase.from("capacidade_horarios").update({ limite: fisioterapia }).eq("tipo", "fisioterapia");
  revalidatePath("/agenda");
}
