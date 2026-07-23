import { requireAccess, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TarefasClient } from "@/components/tarefas/TarefasClient";
import type { Tarefa } from "@/lib/supabase/database.types";

export type TarefaComResponsavel = Tarefa & { profiles: { nome: string } | null };

export default async function TarefasPage() {
  const profile = await requireProfile();
  requireAccess(profile.role, "tarefas");

  const supabase = await createClient();
  const [tarefasRes, profilesRes] = await Promise.all([
    supabase.from("tarefas").select("*, profiles(nome)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,nome").order("nome"),
  ]);

  return (
    <TarefasClient
      tarefas={(tarefasRes.data ?? []) as TarefaComResponsavel[]}
      pessoas={(profilesRes.data ?? []) as { id: string; nome: string }[]}
      profileId={profile.id}
    />
  );
}
