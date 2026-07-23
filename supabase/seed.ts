// Cria as contas reais da equipe (auth + perfil/papel) usando a service role
// key — roda uma única vez por pessoa nova. Uso: npm run seed
//
// Requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.

import { config } from "dotenv";
config({ path: ".env.local" });
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { STAFF } from "./seed.config";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local antes de rodar o seed.");
  process.exit(1);
}

if (STAFF.some((s) => s.email.includes("PREENCHER"))) {
  console.error("Edite supabase/seed.config.ts com os emails reais da equipe antes de rodar o seed.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function gerarSenhaTemporaria() {
  return randomBytes(9).toString("base64url");
}

async function main() {
  console.log(`Criando ${STAFF.length} conta(s)...\n`);
  const credenciais: { nome: string; email: string; senha: string }[] = [];

  for (const staff of STAFF) {
    const senha = gerarSenhaTemporaria();
    const { data, error } = await supabase.auth.admin.createUser({
      email: staff.email,
      password: senha,
      email_confirm: true,
    });

    if (error || !data.user) {
      console.error(`✗ Falha ao criar usuário "${staff.nome}": ${error?.message}`);
      continue;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      nome: staff.nome,
      role: staff.role,
      crefito: staff.crefito,
    });

    if (profileError) {
      console.error(`✗ Usuário "${staff.nome}" criado, mas falha ao salvar o perfil: ${profileError.message}`);
      continue;
    }

    credenciais.push({ nome: staff.nome, email: staff.email, senha });
  }

  if (credenciais.length === 0) {
    console.log("Nenhuma conta criada.");
    return;
  }

  console.log("Contas criadas. Envie cada senha só para a pessoa correspondente,");
  console.log("e peça para trocar assim que fizer o primeiro login:\n");
  for (const c of credenciais) {
    console.log(`  ${c.nome.padEnd(14)} ${c.email.padEnd(38)} senha temporária: ${c.senha}`);
  }
}

main();
