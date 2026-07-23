import type { CategoriaCompra, StatusCompra } from "@/lib/supabase/database.types";

export const CATEGORIAS_COMPRA: CategoriaCompra[] = ["Limpeza", "Escritório", "Equipamentos", "Manutenção", "Consumo", "Outros"];
export const URGENCIAS: ("Baixa" | "Média" | "Alta")[] = ["Baixa", "Média", "Alta"];
export const STATUS_COMPRA: StatusCompra[] = ["Pendente", "Alteração solicitada", "Aprovado", "Rejeitado", "Comprado", "Entregue", "Cancelado"];

export const STATUS_TONE: Record<StatusCompra, "sage" | "brass" | "brick" | "teal"> = {
  Pendente: "brass",
  "Alteração solicitada": "brass",
  Aprovado: "sage",
  Rejeitado: "brick",
  Comprado: "teal",
  Entregue: "sage",
  Cancelado: "brick",
};

export const STATUS_BOLINHA: Record<StatusCompra, string> = {
  Pendente: "🟡",
  "Alteração solicitada": "🟡",
  Aprovado: "🟢",
  Rejeitado: "🔴",
  Comprado: "🔵",
  Entregue: "⚫",
  Cancelado: "🔴",
};
