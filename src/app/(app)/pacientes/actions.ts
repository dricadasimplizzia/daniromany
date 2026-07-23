"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export interface PacienteFormInput {
  nome: string;
  cpf: string;
  nascimento: string;
  telefone: string;
  endereco: string;
  profissao: string;
  peso: string;
  altura: string;
  status: "ativo" | "inativo";
  data_inativacao: string;
  autorizou_imagem: boolean;
  data_assinatura_imagem: string;
  valor_mensalidade: string;
  vencimento: string;
  status_pagamento: "pendente" | "pago";
  data_pagamento: string;
  forma_pagamento: string;
  proxima_avaliacao: string;
}

function toRow(input: PacienteFormInput) {
  return {
    nome: input.nome.trim(),
    cpf: input.cpf || null,
    nascimento: input.nascimento || null,
    telefone: input.telefone || null,
    endereco: input.endereco || null,
    profissao: input.profissao || null,
    peso: input.peso ? Number(input.peso) : null,
    altura: input.altura ? Number(input.altura) : null,
    status: input.status,
    data_inativacao: input.data_inativacao || null,
    autorizou_imagem: input.autorizou_imagem,
    data_assinatura_imagem: input.data_assinatura_imagem || null,
    valor_mensalidade: input.valor_mensalidade ? Number(input.valor_mensalidade) : null,
    vencimento: input.vencimento || null,
    status_pagamento: input.status_pagamento,
    data_pagamento: input.data_pagamento || null,
    forma_pagamento: input.forma_pagamento || null,
    proxima_avaliacao: input.proxima_avaliacao || null,
  };
}

export async function createPaciente(input: PacienteFormInput) {
  await requireProfile();
  if (!input.nome.trim()) return { error: "Informe o nome." };
  const supabase = await createClient();
  const { error } = await supabase.from("pacientes").insert(toRow(input));
  if (error) return { error: error.message };
  revalidatePath("/pacientes");
  return { error: null };
}

export async function updatePaciente(id: string, input: PacienteFormInput) {
  await requireProfile();
  if (!input.nome.trim()) return { error: "Informe o nome." };
  const supabase = await createClient();
  const { error } = await supabase.from("pacientes").update(toRow(input)).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
  return { error: null };
}

export async function deletePaciente(id: string) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("pacientes").delete().eq("id", id);
  revalidatePath("/pacientes");
}
