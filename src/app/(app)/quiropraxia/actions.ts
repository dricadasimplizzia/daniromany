"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export interface QuiropraxiaFormInput {
  paciente_id: string;
  data: string;
  valor_pago: number;
}

export async function createAtendimentoQuiropraxia(input: QuiropraxiaFormInput) {
  const profile = await requireProfile();
  if (!input.paciente_id || !input.valor_pago) return { error: "Selecione o paciente e informe o valor pago." };

  const supabase = await createClient();

  // Só existe um profissional de quiropraxia hoje — se for a própria pessoa
  // registrando, usa o próprio id; se for a proprietária lançando por ela,
  // busca o perfil com esse papel.
  let profissionalId = profile.id;
  if (profile.role !== "quiropraxia") {
    const { data: prof } = await supabase.from("profiles").select("id").eq("role", "quiropraxia").order("created_at").limit(1).maybeSingle();
    if (!prof) return { error: "Nenhum profissional de quiropraxia cadastrado." };
    profissionalId = prof.id;
  }

  const { error } = await supabase.from("quiropraxia_atendimentos").insert({
    paciente_id: input.paciente_id,
    profissional_id: profissionalId,
    data: input.data,
    valor_pago: input.valor_pago,
  });

  if (error) return { error: error.message };
  revalidatePath("/quiropraxia");
  return { error: null };
}

export async function deleteAtendimentoQuiropraxia(id: string) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("quiropraxia_atendimentos").delete().eq("id", id);
  revalidatePath("/quiropraxia");
}
