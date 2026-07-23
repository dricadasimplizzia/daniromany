"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayISO } from "@/lib/format";

export async function marcarPago(pacienteId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { data: paciente } = await supabase.from("pacientes").select("nome,valor_mensalidade,vencimento").eq("id", pacienteId).single();
  if (!paciente) return;

  const base = paciente.vencimento ? new Date(`${paciente.vencimento}T00:00:00`) : new Date();
  const proximo = new Date(base);
  proximo.setMonth(proximo.getMonth() + 1);

  await supabase
    .from("pacientes")
    .update({ status_pagamento: "pago", data_pagamento: todayISO(), vencimento: proximo.toISOString().slice(0, 10) })
    .eq("id", pacienteId);

  await supabase.from("caixa").insert({
    tipo: "entrada",
    descricao: `Mensalidade — ${paciente.nome}`,
    valor: paciente.valor_mensalidade ?? 0,
    data: todayISO(),
  });

  revalidatePath("/financeiro");
  revalidatePath("/painel");
}

export interface LancamentoInput {
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  data: string;
}

export async function createLancamento(input: LancamentoInput) {
  const profile = await requireProfile();
  if (!input.descricao.trim() || !input.valor) return { error: "Preencha descrição e valor." };
  const supabase = await createClient();
  const { error } = await supabase.from("caixa").insert({ ...input, created_by: profile.id });
  if (error) return { error: error.message };
  revalidatePath("/financeiro");
  return { error: null };
}

export async function deleteLancamento(id: string) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("caixa").delete().eq("id", id);
  revalidatePath("/financeiro");
}
