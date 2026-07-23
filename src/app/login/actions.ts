"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error: string | null;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Informe email e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // DIAGNÓSTICO TEMPORÁRIO — reverter para mensagem genérica depois de achar a causa.
    return { error: `[debug] ${error.status ?? "?"} ${error.name}: ${error.message}` };
  }

  const { data: check } = await supabase.auth.getUser();
  // DIAGNÓSTICO TEMPORÁRIO
  return {
    error: `[debug] signIn OK session=${!!data.session} user=${data.user?.id} | getUser after = ${check?.user?.id ?? "NULL"}`,
  };
}
