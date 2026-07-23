import type { CategoriaDocumento } from "@/lib/supabase/database.types";

export const CATEGORIAS_DOC: CategoriaDocumento[] = [
  "Contratos",
  "Alvarás",
  "Licenças",
  "Termos de uso de imagem",
  "Modelos de recibo",
  "Documentos do CREFITO",
  "Notas fiscais de equipamentos",
];

export const CATEGORIAS_RESTRITAS: CategoriaDocumento[] = ["Contratos", "Alvarás", "Licenças", "Notas fiscais de equipamentos"];
