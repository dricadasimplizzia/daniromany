import { requireAccess, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ComprasClient } from "@/components/compras/ComprasClient";
import type { Compra, EstoqueItem } from "@/lib/supabase/database.types";

export type CompraComSolicitante = Compra & { profiles: { nome: string } | null };

export default async function ComprasPage() {
  const profile = await requireProfile();
  requireAccess(profile.role, "compras");

  const supabase = await createClient();
  const [comprasRes, estoqueRes] = await Promise.all([
    supabase.from("compras").select("*, profiles(nome)").order("data_solicitacao", { ascending: false }),
    supabase.from("estoque").select("*").order("produto", { ascending: true }),
  ]);

  return (
    <ComprasClient
      compras={(comprasRes.data ?? []) as CompraComSolicitante[]}
      estoque={(estoqueRes.data ?? []) as EstoqueItem[]}
      role={profile.role}
    />
  );
}
