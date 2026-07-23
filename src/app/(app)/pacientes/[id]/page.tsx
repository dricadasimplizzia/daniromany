import { notFound } from "next/navigation";
import { requireAccess, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PacienteDetalheClient } from "@/components/pacientes/PacienteDetalheClient";
import type { Anamnese, Evolucao, Paciente } from "@/lib/supabase/database.types";

export default async function PacienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  requireAccess(profile.role, "pacientes");
  const { id } = await params;

  const supabase = await createClient();
  const [pacienteRes, anamneseRes, evolucoesRes] = await Promise.all([
    supabase.from("pacientes").select("*").eq("id", id).maybeSingle(),
    supabase.from("anamneses").select("*").eq("paciente_id", id).maybeSingle(),
    supabase.from("evolucoes").select("*").eq("paciente_id", id).order("data", { ascending: false }),
  ]);

  if (!pacienteRes.data) notFound();

  return (
    <PacienteDetalheClient
      paciente={pacienteRes.data as Paciente}
      anamnese={anamneseRes.data as Anamnese | null}
      evolucoes={(evolucoesRes.data ?? []) as Evolucao[]}
      role={profile.role}
    />
  );
}
