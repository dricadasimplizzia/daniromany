"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayISO } from "@/lib/format";
import type { BlocoSintoma, FortalecimentoItem, SinaisVitais } from "@/lib/supabase/database.types";

export async function salvarAnamnese(pacienteId: string, texto: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: existente } = await supabase.from("anamneses").select("id").eq("paciente_id", pacienteId).maybeSingle();

  if (existente) {
    await supabase
      .from("anamneses")
      .update({ texto, atualizado_em: todayISO(), updated_by: profile.id })
      .eq("id", existente.id);
  } else {
    await supabase.from("anamneses").insert({ paciente_id: pacienteId, texto, atualizado_em: todayISO(), updated_by: profile.id });
  }

  revalidatePath(`/pacientes/${pacienteId}`);
}

export interface EvolucaoFormInput {
  data: string;
  sinais_vitais: SinaisVitais;
  pre: BlocoSintoma;
  intercorrencias: BlocoSintoma;
  pos: BlocoSintoma;
  aparelhos: string[];
  acessorios: string[];
  acessorios_outros: string;
  aquecimento: string[];
  aquecimento_outros: string;
  mobilidade: string[];
  mobilidade_outros: string;
  alongamentos: string[];
  alongamentos_outros: string;
  fortalecimento: Record<string, FortalecimentoItem>;
  fortalecimento_outros: string;
  relaxamento: string[];
  relaxamento_outros: string;
  outros_treinos: string[];
  observacoes: string;
}

export async function salvarEvolucao(pacienteId: string, input: EvolucaoFormInput) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("evolucoes").insert({
    paciente_id: pacienteId,
    data: input.data,
    sinais_vitais: input.sinais_vitais,
    pre: input.pre,
    intercorrencias: input.intercorrencias,
    pos: input.pos,
    aparelhos: input.aparelhos,
    acessorios: input.acessorios,
    acessorios_outros: input.acessorios_outros || null,
    aquecimento: input.aquecimento,
    aquecimento_outros: input.aquecimento_outros || null,
    mobilidade: input.mobilidade,
    mobilidade_outros: input.mobilidade_outros || null,
    alongamentos: input.alongamentos,
    alongamentos_outros: input.alongamentos_outros || null,
    fortalecimento: input.fortalecimento,
    fortalecimento_outros: input.fortalecimento_outros || null,
    relaxamento: input.relaxamento,
    relaxamento_outros: input.relaxamento_outros || null,
    outros_treinos: input.outros_treinos,
    observacoes: input.observacoes || null,
    profissional_id: profile.id,
    profissional_nome: profile.nome,
    crefito: profile.crefito,
  });

  if (error) return { error: error.message };

  revalidatePath(`/pacientes/${pacienteId}`);
  return { error: null };
}
