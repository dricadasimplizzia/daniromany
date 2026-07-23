"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayISO } from "@/lib/format";
import type { CategoriaCompra } from "@/lib/supabase/database.types";

export interface CompraFormInput {
  produto: string;
  categoria: CategoriaCompra;
  quantidade: number;
  valor_estimado: number | null;
  fornecedor: string;
  justificativa: string;
  urgencia: "Baixa" | "Média" | "Alta";
}

export async function solicitarCompra(input: CompraFormInput) {
  const profile = await requireProfile();
  if (!input.produto.trim()) return { error: "Informe o produto." };
  const supabase = await createClient();
  const { error } = await supabase.from("compras").insert({
    produto: input.produto.trim(),
    categoria: input.categoria,
    quantidade: input.quantidade || 1,
    valor_estimado: input.valor_estimado,
    fornecedor: input.fornecedor || null,
    justificativa: input.justificativa || null,
    urgencia: input.urgencia,
    solicitante_id: profile.id,
    data_solicitacao: todayISO(),
    status: "Pendente",
  });
  if (error) return { error: error.message };
  revalidatePath("/compras");
  return { error: null };
}

export interface AprovacaoInput {
  valor_aprovado: number | null;
  fornecedor_escolhido: string;
  data_prevista: string;
}

export async function aprovarCompra(id: string, input: AprovacaoInput) {
  await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("compras")
    .update({
      status: "Aprovado",
      valor_aprovado: input.valor_aprovado,
      fornecedor_escolhido: input.fornecedor_escolhido || null,
      data_prevista: input.data_prevista || null,
    })
    .eq("id", id);
  revalidatePath("/compras");
}

export async function rejeitarCompra(id: string) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("compras").update({ status: "Rejeitado" }).eq("id", id);
  revalidatePath("/compras");
}

export async function solicitarAlteracaoCompra(id: string, motivo: string) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("compras").update({ status: "Alteração solicitada", motivo_alteracao: motivo }).eq("id", id);
  revalidatePath("/compras");
}

export async function cancelarCompra(id: string) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("compras").update({ status: "Cancelado" }).eq("id", id);
  revalidatePath("/compras");
}

export async function marcarCompraRealizada(id: string) {
  await requireProfile();
  const supabase = await createClient();
  const { data: compra } = await supabase.from("compras").select("produto,valor_aprovado,valor_estimado").eq("id", id).single();
  await supabase.from("compras").update({ status: "Comprado", data_compra: todayISO() }).eq("id", id);
  if (compra) {
    await supabase.from("caixa").insert({
      tipo: "saida",
      descricao: `Compra — ${compra.produto}`,
      valor: compra.valor_aprovado ?? compra.valor_estimado ?? 0,
      data: todayISO(),
    });
  }
  revalidatePath("/compras");
  revalidatePath("/financeiro");
}

export async function marcarCompraEntregue(id: string) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("compras").update({ status: "Entregue" }).eq("id", id);
  revalidatePath("/compras");
}

export interface EstoqueFormInput {
  produto: string;
  quantidade_atual: number;
  quantidade_minima: number;
}

export async function addEstoque(input: EstoqueFormInput) {
  await requireProfile();
  if (!input.produto.trim()) return { error: "Informe o produto." };
  const supabase = await createClient();
  const { error } = await supabase.from("estoque").insert(input);
  if (error) return { error: error.message };
  revalidatePath("/compras");
  return { error: null };
}

export async function ajustarEstoque(id: string, delta: number) {
  await requireProfile();
  const supabase = await createClient();
  const { data: item } = await supabase.from("estoque").select("quantidade_atual").eq("id", id).single();
  if (!item) return;
  await supabase
    .from("estoque")
    .update({ quantidade_atual: Math.max(0, Number(item.quantidade_atual) + delta) })
    .eq("id", id);
  revalidatePath("/compras");
}

export async function removeEstoque(id: string) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("estoque").delete().eq("id", id);
  revalidatePath("/compras");
}
