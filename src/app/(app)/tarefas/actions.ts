"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export interface TarefaFormInput {
  titulo: string;
  responsavel_id: string;
  prazo: string;
  prioridade: "Baixa" | "Média" | "Alta";
}

export async function createTarefa(input: TarefaFormInput) {
  await requireProfile();
  if (!input.titulo.trim()) return { error: "Descreva a tarefa." };
  const supabase = await createClient();
  const { error } = await supabase.from("tarefas").insert({
    titulo: input.titulo.trim(),
    responsavel_id: input.responsavel_id || null,
    prazo: input.prazo || null,
    prioridade: input.prioridade,
    status: "Pendente",
  });
  if (error) return { error: error.message };
  revalidatePath("/tarefas");
  return { error: null };
}

export async function updateStatusTarefa(id: string, status: "Pendente" | "Em andamento" | "Concluída") {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("tarefas").update({ status }).eq("id", id);
  revalidatePath("/tarefas");
}

export async function deleteTarefa(id: string) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("tarefas").delete().eq("id", id);
  revalidatePath("/tarefas");
}
