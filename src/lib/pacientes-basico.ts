import { createClient } from "@/lib/supabase/server";

/** Mapa id -> nome usando a view pacientes_basico (sem CPF/endereço/financeiro),
 * segura para qualquer perfil — inclusive quiropraxia, que não acessa a tabela
 * `pacientes` completa mas precisa exibir o nome do paciente na própria agenda. */
export async function getPacientesBasicoMap(): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("pacientes_basico").select("id,nome");
  return new Map((data ?? []).map((p) => [p.id as string, p.nome as string]));
}
