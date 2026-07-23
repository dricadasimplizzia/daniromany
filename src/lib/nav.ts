// Constantes e helpers de navegação/permissão isomórficos (client + server).
// Nada aqui pode importar módulos server-only (next/headers etc) — componentes
// client (ex.: PacienteDetalheClient) importam `podeVerClinico` daqui.

import {
  Home,
  Calendar,
  Users,
  Wallet,
  Stethoscope,
  ShoppingCart,
  ListChecks,
  FolderLock,
  MessageCircle,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "@/lib/supabase/database.types";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: AppRole[];
}

const ALL_ROLES: AppRole[] = ["proprietaria", "administradora", "fisioterapia", "quiropraxia"];

export const NAV_ALL: NavItem[] = [
  { key: "painel", label: "Painel", href: "/painel", icon: Home, roles: ALL_ROLES },
  { key: "agenda", label: "Agenda", href: "/agenda", icon: Calendar, roles: ALL_ROLES },
  { key: "pacientes", label: "Pacientes", href: "/pacientes", icon: Users, roles: ["proprietaria", "administradora", "fisioterapia"] },
  { key: "financeiro", label: "Financeiro", href: "/financeiro", icon: Wallet, roles: ["proprietaria", "administradora", "fisioterapia"] },
  { key: "quiropraxia", label: "Quiropraxia", href: "/quiropraxia", icon: Stethoscope, roles: ["proprietaria", "quiropraxia"] },
  { key: "compras", label: "Compras", href: "/compras", icon: ShoppingCart, roles: ALL_ROLES },
  { key: "tarefas", label: "Tarefas", href: "/tarefas", icon: ListChecks, roles: ALL_ROLES },
  { key: "documentos", label: "Documentos", href: "/documentos", icon: FolderLock, roles: ALL_ROLES },
  { key: "comunicacao", label: "Comunicação", href: "/comunicacao", icon: MessageCircle, roles: ["proprietaria", "administradora", "fisioterapia"] },
  { key: "relatorios", label: "Relatórios", href: "/relatorios", icon: FileText, roles: ["proprietaria", "administradora", "fisioterapia"] },
];

export function navForRole(role: AppRole): NavItem[] {
  return NAV_ALL.filter((n) => n.roles.includes(role));
}

export function canAccess(role: AppRole, key: string): boolean {
  const item = NAV_ALL.find((n) => n.key === key);
  return item ? item.roles.includes(role) : false;
}

export const ROLE_LABEL: Record<AppRole, string> = {
  proprietaria: "Proprietária · Fisioterapia/Pilates",
  administradora: "Administrativo",
  fisioterapia: "Fisioterapia",
  quiropraxia: "Quiropraxia",
};

export const podeVerClinico = (role: AppRole) => role === "proprietaria" || role === "fisioterapia";
export const podeVerFinanceiroGeral = (role: AppRole) => role === "proprietaria";
export const podeAprovarCompras = (role: AppRole) => role === "proprietaria" || role === "administradora";
export const podeVerDocRestrito = (role: AppRole) => role === "proprietaria" || role === "administradora";
export const podeEditarMensalidade = (role: AppRole) => role === "proprietaria";
