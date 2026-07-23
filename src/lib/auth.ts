// Helpers server-only de sessão. Componentes client devem importar de
// "@/lib/nav" (constantes/matriz de permissão) em vez daqui.

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/database.types";
import { canAccess } from "@/lib/nav";

export * from "@/lib/nav";

// cache() memoiza por request: layout e página podem chamar requireProfile()
// sem duplicar a consulta ao Supabase.
const getSessionProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return profile && profile.ativo ? profile : null;
});

/** Carrega o perfil do usuário autenticado ou redireciona para /login.
 * Use em toda página/layout que exige sessão — o proxy (middleware) já bloqueia
 * requests sem sessão, isso é uma segunda camada + dá acesso ao `profile`. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Redireciona para o painel se o perfil não tiver acesso à seção atual
 * (defesa em profundidade — o RLS do banco já nega os dados de qualquer forma). */
export function requireAccess(role: Profile["role"], key: string) {
  if (!canAccess(role, key)) redirect("/painel");
}
