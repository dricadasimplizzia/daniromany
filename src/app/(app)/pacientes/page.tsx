import { requireAccess, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PacientesListClient } from "@/components/pacientes/PacientesListClient";
import type { Paciente } from "@/lib/supabase/database.types";

export default async function PacientesPage() {
  const profile = await requireProfile();
  requireAccess(profile.role, "pacientes");

  const supabase = await createClient();
  const { data } = await supabase.from("pacientes").select("*").order("nome", { ascending: true });

  return <PacientesListClient pacientes={(data ?? []) as Paciente[]} role={profile.role} />;
}
