// Copie este arquivo para supabase/seed.config.ts (já está no .gitignore) e
// preencha com os dados reais da equipe antes de rodar `npm run seed`.
//
// O email precisa ser um endereço real que a pessoa acesse — é por ali que
// ela consegue usar "esqueci minha senha" depois do primeiro login.

import type { AppRole } from "../src/lib/supabase/database.types";

export interface StaffSeed {
  nome: string;
  email: string;
  role: AppRole;
  crefito: string | null;
}

export const STAFF: StaffSeed[] = [
  { nome: "Dani Romany", email: "PREENCHER@exemplo.com", role: "proprietaria", crefito: "CREFITO 12345-F" },
  { nome: "Dani Souza", email: "PREENCHER@exemplo.com", role: "administradora", crefito: null },
  { nome: "Sabrina", email: "PREENCHER@exemplo.com", role: "fisioterapia", crefito: "CREFITO 23456-F" },
  { nome: "Franciele", email: "PREENCHER@exemplo.com", role: "quiropraxia", crefito: "CREFITO 67890-F" },
];
