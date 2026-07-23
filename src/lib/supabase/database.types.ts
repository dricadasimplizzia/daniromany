// Tipos manuais alinhados ao schema em supabase/migrations.
// Assim que o projeto Supabase estiver linkado, rode:
//   npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
// para substituir este arquivo pela versão gerada automaticamente.

export type AppRole = "proprietaria" | "administradora" | "fisioterapia" | "quiropraxia";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Profile {
  id: string;
  nome: string;
  role: AppRole;
  crefito: string | null;
  ativo: boolean;
  created_at: string;
}

export interface Paciente {
  id: string;
  nome: string;
  cpf: string | null;
  nascimento: string | null;
  telefone: string | null;
  endereco: string | null;
  profissao: string | null;
  peso: number | null;
  altura: number | null;
  status: "ativo" | "inativo";
  data_inativacao: string | null;
  autorizou_imagem: boolean;
  data_assinatura_imagem: string | null;
  termo_imagem_path: string | null;
  valor_mensalidade: number | null;
  vencimento: string | null;
  status_pagamento: "pendente" | "pago";
  data_pagamento: string | null;
  forma_pagamento: string | null;
  proxima_avaliacao: string | null;
  created_at: string;
  updated_at: string;
}

export type TipoAtendimento = "pilates" | "fisioterapia" | "quiropraxia";

export interface AgendaItem {
  id: string;
  paciente_id: string;
  tipo: TipoAtendimento;
  data: string;
  horario: string;
  status: "agendado" | "realizado" | "falta" | "cancelado";
  confirmacao: "pendente" | "confirmou" | "cancelou";
  motivo_alteracao: string | null;
  tem_reposicao: boolean;
  created_at: string;
}

export interface AgendaHistoricoItem {
  id: string;
  agenda_id: string;
  data: string;
  acao: string;
  motivo: string | null;
}

export interface Anamnese {
  id: string;
  paciente_id: string;
  texto: string | null;
  atualizado_em: string;
  updated_by: string | null;
}

export interface SinaisVitais {
  aferido: "sim" | "nao";
  pa: string;
  fc: string;
}

export interface BlocoSintoma {
  semIntercorrencias?: boolean;
  higido?: boolean;
  marcado: boolean;
  regioes: string[];
  dorIrradiada: boolean;
  dorTipos: string[];
  encurtamento?: boolean;
  cadeias?: string[];
  tontura?: boolean;
  elevacaoPA?: boolean;
  reducaoPA?: boolean;
  outros: string;
}

export interface FortalecimentoItem {
  marcado: boolean;
  reps: string[];
}

export interface Evolucao {
  id: string;
  paciente_id: string;
  data: string;
  sinais_vitais: SinaisVitais;
  pre: BlocoSintoma;
  intercorrencias: BlocoSintoma;
  pos: BlocoSintoma;
  aparelhos: string[];
  acessorios: string[];
  acessorios_outros: string | null;
  aquecimento: string[];
  aquecimento_outros: string | null;
  mobilidade: string[];
  mobilidade_outros: string | null;
  alongamentos: string[];
  alongamentos_outros: string | null;
  fortalecimento: Record<string, FortalecimentoItem>;
  fortalecimento_outros: string | null;
  relaxamento: string[];
  relaxamento_outros: string | null;
  outros_treinos: string[];
  observacoes: string | null;
  profissional_id: string | null;
  profissional_nome: string;
  crefito: string | null;
  created_at: string;
}

export interface CaixaItem {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  data: string;
  created_by: string | null;
  created_at: string;
}

export interface CapacidadeHorario {
  tipo: "pilates" | "fisioterapia";
  limite: number;
}

export interface QuiropraxiaAtendimento {
  id: string;
  paciente_id: string;
  profissional_id: string;
  data: string;
  valor_pago: number;
  percentual_comissao: number;
  comissao_profissional: number;
  valor_studio: number;
  created_at: string;
}

export interface Mensagem {
  id: string;
  paciente_id: string | null;
  paciente_nome: string | null;
  tipo: "confirmacao" | "lembrete" | "pagamento" | "avaliacao";
  contexto: string | null;
  data: string;
  created_by: string | null;
}

export type CategoriaCompra = "Limpeza" | "Escritório" | "Equipamentos" | "Manutenção" | "Consumo" | "Outros";
export type StatusCompra = "Pendente" | "Alteração solicitada" | "Aprovado" | "Rejeitado" | "Comprado" | "Entregue" | "Cancelado";

export interface Compra {
  id: string;
  produto: string;
  categoria: CategoriaCompra;
  quantidade: number;
  valor_estimado: number | null;
  fornecedor: string | null;
  justificativa: string | null;
  urgencia: "Baixa" | "Média" | "Alta";
  solicitante_id: string;
  data_solicitacao: string;
  status: StatusCompra;
  valor_aprovado: number | null;
  fornecedor_escolhido: string | null;
  data_prevista: string | null;
  data_compra: string | null;
  motivo_alteracao: string | null;
  created_at: string;
}

export interface EstoqueItem {
  id: string;
  produto: string;
  quantidade_atual: number;
  quantidade_minima: number;
}

export interface Tarefa {
  id: string;
  titulo: string;
  responsavel_id: string | null;
  prazo: string | null;
  prioridade: "Baixa" | "Média" | "Alta";
  status: "Pendente" | "Em andamento" | "Concluída";
  created_at: string;
}

export type CategoriaDocumento =
  | "Contratos"
  | "Alvarás"
  | "Licenças"
  | "Termos de uso de imagem"
  | "Modelos de recibo"
  | "Documentos do CREFITO"
  | "Notas fiscais de equipamentos";

export interface Documento {
  id: string;
  nome: string;
  categoria: CategoriaDocumento;
  storage_path: string;
  restrito: boolean;
  data_upload: string;
  uploaded_by: string | null;
}
