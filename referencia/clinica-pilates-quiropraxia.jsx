import React, { useState, useEffect, useCallback } from "react";
import {
  Home, Calendar, Users, Wallet, ShoppingBag, Bell, FileText, MessageCircle,
  Plus, X, Check, Trash2, Phone, Clock, AlertTriangle, TrendingUp, TrendingDown,
  ArrowLeft, Stethoscope, ClipboardList, ShieldCheck, LogOut, Printer,
  ShoppingCart, ListChecks, FolderLock, Package, Link as LinkIcon, Lock
} from "lucide-react";

/* ---------------------------------------------------------
   TOKENS
--------------------------------------------------------- */
const C = {
  bg: "#F1E6D9", surface: "#FFFFFF", border: "#E5D5C3",
  ink: "#33261E", inkMuted: "#8C7A6A",
  sage: "#BE6A45", sageSoft: "#F3DECD",
  brass: "#A9743E", brassSoft: "#F1E3CC",
  brick: "#8B3E2E", brickSoft: "#F1DCD4",
  teal: "#4A372B", tealSoft: "#E6DED4",
};
const FONT_DISPLAY = "'Fraunces', Georgia, serif";
const FONT_BODY = "'IBM Plex Sans', system-ui, sans-serif";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtMoney = (n) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso) => { if (!iso) return "—"; const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
const idade = (nasc) => { if (!nasc) return "—"; const b = new Date(nasc), t = new Date(); let a = t.getFullYear() - b.getFullYear(); if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; return a; };

function resumoSintoma(s) {
  if (!s) return "—";
  const partes = [];
  if (s.semIntercorrencias) partes.push("Sem intercorrências");
  if (s.higido) partes.push("Hígido");
  if (s.marcado) partes.push(`Quadro álgico (${(s.regioes || []).join(", ") || "sem região"})`);
  if (s.dorIrradiada) partes.push(`Dor irradiada (${(s.dorTipos || []).join(", ") || "—"})`);
  if (s.encurtamento) partes.push(`Encurtamento (${(s.cadeias || []).join(", ") || "—"})`);
  if (s.tontura) partes.push("Tontura");
  if (s.elevacaoPA) partes.push("Elevação P.A.");
  if (s.reducaoPA) partes.push("Redução P.A.");
  if (s.outros) partes.push(s.outros);
  return partes.join(" · ") || "—";
}

/* ---------------------------------------------------------
   PERFIS (login simulado — não é autenticação real)
--------------------------------------------------------- */
const USERS = [
  { id: "dani-romany", nome: "Dani Romany", papel: "Proprietária · Fisioterapia/Pilates", crefito: "CREFITO 12345-F", nivel: "total" },
  { id: "dani-souza", nome: "Dani Souza", papel: "Administrativo", crefito: null, nivel: "gerencial" },
  { id: "sabrina", nome: "Sabrina", papel: "Fisioterapia", crefito: "CREFITO 23456-F", nivel: "fisio" },
  { id: "franciele", nome: "Franciele", papel: "Quiropraxia", crefito: "CREFITO 67890-F", nivel: "restrito" },
];
/* Níveis: total = Dani Romany, proprietária (acesso e permissão irrestritos)
           gerencial = Dani Souza, administrativo (vê/opera quase tudo, mas não decide desconto/mensalidade,
                       não vê financeiro geral, não mexe na comissão da Franciele — e é quem aprova compras)
           fisio = Sabrina, fisioterapia (acesso clínico a pacientes/evoluções, sem financeiro geral)
           restrito = Franciele, quiropraxia (só a própria agenda/comissão) */

const SpringDivider = ({ color = C.sage, width = 120 }) => {
  const segs = 10, seg = width / segs, pts = [];
  for (let i = 0; i <= segs; i++) pts.push(`${i * seg},${i % 2 === 0 ? 6 : 0}`);
  return <svg width={width} height="8" viewBox={`0 0 ${width} 8`}><polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" /></svg>;
};

function Loading() {
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "80px 0", color: C.inkMuted, fontFamily: FONT_BODY }}><SpringDivider width={80} /><span style={{ fontSize: 13 }}>Carregando...</span></div>;
}

/* ---------------------------------------------------------
   STORAGE
--------------------------------------------------------- */
function useCollection(key, shared = true) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(key, shared);
        if (!cancelled) { setItems(res ? JSON.parse(res.value) : []); setLoaded(true); }
      } catch (e) { if (!cancelled) { setItems([]); setLoaded(true); } }
    })();
    return () => { cancelled = true; };
  }, [key, shared]);

  const persist = useCallback(async (next) => {
    setItems(next);
    try {
      const res = await window.storage.set(key, JSON.stringify(next), shared);
      setError(res ? null : "Não foi possível salvar agora. Tente novamente.");
    } catch (e) { setError("Erro ao salvar os dados."); }
  }, [key, shared]);

  return { items, loaded, error, persist };
}

/* ---------------------------------------------------------
   UI PRIMITIVES
--------------------------------------------------------- */
const Card = ({ children, style }) => <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, ...style }}>{children}</div>;

function Button({ children, onClick, variant = "primary", style, small, type = "button" }) {
  const variants = {
    primary: { background: C.sage, color: "#fff", border: `1px solid ${C.sage}` },
    ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.border}` },
    danger: { background: C.brick, color: "#fff", border: `1px solid ${C.brick}` },
  };
  return (
    <button type={type} onClick={onClick} style={{ ...variants[variant], borderRadius: 10, padding: small ? "6px 12px" : "10px 16px", fontFamily: FONT_BODY, fontSize: small ? 13 : 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, ...style }}>
      {children}
    </button>
  );
}

const Field = ({ label, children }) => <label style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: FONT_BODY }}><span style={{ fontSize: 12.5, color: C.inkMuted, fontWeight: 600 }}>{label}</span>{children}</label>;
const inputStyle = { border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 11px", fontSize: 14, fontFamily: FONT_BODY, color: C.ink, background: "#FDFCFA", outline: "none", width: "100%" };
const Input = (p) => <input {...p} style={{ ...inputStyle, ...(p.style || {}) }} />;
const Select = (p) => <select {...p} style={{ ...inputStyle, ...(p.style || {}) }} />;
const TextArea = (p) => <textarea {...p} style={{ ...inputStyle, resize: "vertical", minHeight: 70, ...(p.style || {}) }} />;

function Badge({ children, tone = "sage" }) {
  const tones = { sage: [C.sageSoft, C.sage], brass: [C.brassSoft, C.brass], brick: [C.brickSoft, C.brick], teal: [C.tealSoft, C.teal] };
  const [bg, color] = tones[tone];
  return <span style={{ background: bg, color, fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, letterSpacing: 0.2, textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>;
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 13.5, color: C.ink, cursor: "pointer", padding: "3px 0" }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 16, height: 16, accentColor: C.sage }} />
      {label}
    </label>
  );
}

function CheckGroup({ options, values, onToggle, columns = 2 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 2 }}>
      {options.map(o => <Checkbox key={o} label={o} checked={values.includes(o)} onChange={() => onToggle(o)} />)}
    </div>
  );
}

function Modal({ title, onClose, children, width = 560 }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(39,37,32,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "88vh", overflowY: "auto", padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: C.ink, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkMuted }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const Empty = ({ icon: Icon, text }) => <div style={{ textAlign: "center", padding: "44px 20px", color: C.inkMuted, fontFamily: FONT_BODY }}><Icon size={26} strokeWidth={1.4} style={{ marginBottom: 8, opacity: 0.6 }} /><div style={{ fontSize: 13.5 }}>{text}</div></div>;

const SectionTitle = ({ children }) => <div><h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, margin: 0, color: C.ink }}>{children}</h2><SpringDivider width={64} /></div>;

/* ---------------------------------------------------------
   TELA DE LOGIN (simulação de perfil)
--------------------------------------------------------- */
function LoginScreen({ onSelect }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FONT_BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.ink, margin: 0, letterSpacing: 0.5 }}>DANIELLA ROMANY</h1>
          <div style={{ color: C.inkMuted, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>Studio Pilates & Saúde Integrada</div>
          <div style={{ color: C.inkMuted, fontSize: 13, marginTop: 6 }}>Sistema de gestão</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {USERS.map(u => (
            <button key={u.id} onClick={() => onSelect(u)} style={{ textAlign: "left", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 15, color: C.ink }}>{u.nome}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkMuted }}>{u.papel}</div>
              </div>
              <ShieldCheck size={18} color={C.sage} />
            </button>
          ))}
        </div>
        <div style={{ marginTop: 18, fontSize: 11.5, color: C.inkMuted, textAlign: "center", lineHeight: 1.5 }}>
          Protótipo de validação: aqui a entrada é por seleção de perfil.<br />No sistema final, cada perfil terá login com senha própria.
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   PAINEL (dashboard + alertas automáticos)
--------------------------------------------------------- */
function Painel({ pacientes, agenda, evolucoes, compras, user, setTab }) {
  const hoje = todayISO();
  const vencidos = pacientes.filter(p => p.vencimento && p.vencimento < hoje && p.statusPagamento !== "pago" && p.status !== "inativo");
  const inativos = pacientes.filter(p => p.status === "inativo");
  const avaliacaoProxima = pacientes.filter(p => p.proximaAvaliacao && p.proximaAvaliacao <= hoje && p.status !== "inativo");
  const atendimentosHoje = agenda.filter(a => a.data === hoje && (user.nivel !== "restrito" || a.tipo === "quiropraxia"));
  const semEvolucao = atendimentosHoje.filter(a => a.status === "realizado" && !evolucoes.some(e => e.pacienteId === a.pacienteId && e.data === hoje));
  const mesAtual = hoje.slice(0, 7);
  const comprasPendentes = compras.filter(c => c.status === "Pendente" || c.status === "Alteração solicitada");
  const comprasAprovadas = compras.filter(c => c.status === "Aprovado");
  const previstoMes = compras.filter(c => c.dataSolicitacao.startsWith(mesAtual) && !["Rejeitado", "Cancelado"].includes(c.status)).reduce((s, c) => s + Number(c.valorAprovado || c.valorEstimado || 0), 0);
  const gastoMes = compras.filter(c => c.dataCompra && c.dataCompra.startsWith(mesAtual)).reduce((s, c) => s + Number(c.valorAprovado || c.valorEstimado || 0), 0);

  const stats = [
    { label: "Atendimentos hoje", value: atendimentosHoje.length, icon: Calendar, tone: "brass" },
    { label: "Mensalidades vencidas", value: vencidos.length, icon: AlertTriangle, tone: "brick" },
    { label: "Evoluções pendentes hoje", value: semEvolucao.length, icon: ClipboardList, tone: "teal" },
    { label: "Pacientes inativos", value: inativos.length, icon: Users, tone: "sage" },
    { label: "Compras aguardando aprovação", value: comprasPendentes.length, icon: ShoppingCart, tone: "brass" },
    { label: "Compras aprovadas", value: comprasAprovadas.length, icon: ShoppingCart, tone: "sage" },
    { label: "Previsto em compras (mês)", value: fmtMoney(previstoMes), icon: TrendingUp, tone: "brass" },
    { label: "Gasto em compras (mês)", value: fmtMoney(gastoMes), icon: TrendingDown, tone: "brick" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14 }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: C.inkMuted, fontWeight: 600, fontFamily: FONT_BODY }}>{s.label}</span>
              <s.icon size={16} color={C[s.tone]} />
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.ink }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="dash-grid">
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><AlertTriangle size={16} color={C.brick} /><h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, margin: 0 }}>Mensalidades vencidas / inadimplentes</h3></div>
          {vencidos.length === 0 ? <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.inkMuted }}>Tudo em dia.</div> :
            vencidos.map(p => <div key={p.id} style={{ fontFamily: FONT_BODY, fontSize: 13.5, padding: "5px 0", display: "flex", justifyContent: "space-between" }}><span>{p.nome}</span><span style={{ color: C.brick, fontWeight: 600 }}>desde {fmtDate(p.vencimento)}</span></div>)}
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><Stethoscope size={16} color={C.teal} /><h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, margin: 0 }}>Reavaliação necessária</h3></div>
          {avaliacaoProxima.length === 0 ? <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.inkMuted }}>Nenhuma pendente.</div> :
            avaliacaoProxima.map(p => <div key={p.id} style={{ fontFamily: FONT_BODY, fontSize: 13.5, padding: "5px 0" }}>{p.nome} — prevista {fmtDate(p.proximaAvaliacao)}</div>)}
        </Card>
      </div>
      {semEvolucao.length > 0 && (
        <Card style={{ borderColor: C.brick }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><ClipboardList size={16} color={C.brick} /><h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, margin: 0 }}>Evolução clínica não registrada hoje</h3></div>
          {semEvolucao.map(a => <div key={a.id} style={{ fontFamily: FONT_BODY, fontSize: 13.5, padding: "4px 0" }}>{a.pacienteNome} — {a.horario}</div>)}
          <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 6, fontFamily: FONT_BODY }}>Exigência do CREFITO: todo atendimento realizado precisa de evolução correspondente.</div>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   AGENDA
--------------------------------------------------------- */
const TIPOS = [
  { v: "pilates", label: "Pilates", tone: "sage" },
  { v: "fisioterapia", label: "Fisioterapia", tone: "teal" },
  { v: "quiropraxia", label: "Quiropraxia", tone: "brass" },
];

function Agenda({ agenda, persist, pacientes, capacidade, persistCapacidade, user }) {
  const [dataFiltro, setDataFiltro] = useState(todayISO());
  const [modal, setModal] = useState(null);
  const emptyForm = { pacienteId: "", tipo: "pilates", data: dataFiltro, horario: "08:00", status: "agendado", confirmacao: "pendente", motivoAlteracao: "", temReposicao: false, historico: [] };
  const [form, setForm] = useState(emptyForm);
  const [showConfig, setShowConfig] = useState(false);

  const visivel = user.nivel === "restrito" ? agenda.filter(a => a.tipo === "quiropraxia") : agenda;
  const doDia = visivel.filter(a => a.data === dataFiltro).sort((a, b) => a.horario.localeCompare(b.horario));

  const contarNoHorario = (data, horario, tipo, excluirId) =>
    agenda.filter(a => a.data === data && a.horario === horario && a.tipo === tipo && a.status !== "cancelado" && a.id !== excluirId).length;

  const openNew = () => { setForm({ ...emptyForm, data: dataFiltro }); setModal("new"); };
  const openEdit = (a) => { setForm(a); setModal(a.id); };

  const save = () => {
    if (!form.pacienteId) return;
    const paciente = pacientes.find(p => p.id === form.pacienteId);
    const record = { ...form, pacienteNome: paciente ? paciente.nome : "" };
    if (modal === "new") {
      persist([...agenda, { ...record, id: uid(), historico: [{ data: new Date().toISOString(), acao: "Criado" }] }]);
    } else {
      const anterior = agenda.find(a => a.id === modal);
      const hist = [...(anterior.historico || [])];
      if (anterior.data !== record.data || anterior.horario !== record.horario) hist.push({ data: new Date().toISOString(), acao: `Remarcado de ${fmtDate(anterior.data)} ${anterior.horario} para ${fmtDate(record.data)} ${record.horario}`, motivo: form.motivoAlteracao });
      if (anterior.status !== record.status) hist.push({ data: new Date().toISOString(), acao: `Status alterado para ${record.status}`, motivo: form.motivoAlteracao });
      persist(agenda.map(a => a.id === modal ? { ...record, id: modal, historico: hist } : a));
    }
    setModal(null);
  };
  const remove = (id) => persist(agenda.filter(a => a.id !== id));
  const setConfirmacao = (a, val) => persist(agenda.map(x => x.id === a.id ? { ...x, confirmacao: val } : x));

  const limitePilates = Number(capacidade.pilates) || 6;
  const limiteFisio = Number(capacidade.fisioterapia) || 3;
  const excedeLimite = form.tipo !== "quiropraxia" && contarNoHorario(form.data, form.horario, form.tipo, modal === "new" ? null : modal) >= (form.tipo === "pilates" ? limitePilates : limiteFisio);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <SectionTitle>Agenda</SectionTitle>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Input type="date" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} style={{ width: 160 }} />
          {user.nivel === "total" && <Button variant="ghost" onClick={() => setShowConfig(true)} small>Limites por horário</Button>}
          <Button onClick={openNew}><Plus size={16} /> Agendar</Button>
        </div>
      </div>

      {doDia.length === 0 && <Empty icon={Calendar} text="Nenhum atendimento nessa data." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {doDia.map(a => {
          const t = TIPOS.find(t => t.v === a.tipo);
          return (
            <Card key={a.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Badge tone="brass">{a.horario}</Badge>
                  <Badge tone={t.tone}>{t.label}</Badge>
                  <div>
                    <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, color: C.ink }}>{a.pacienteNome}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkMuted }}>
                      {a.status} {a.temReposicao ? "· tem direito a reposição" : ""} · confirmação: {a.confirmacao}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {a.confirmacao === "pendente" && (
                    <>
                      <Button variant="ghost" small onClick={() => setConfirmacao(a, "confirmou")}>Confirmou</Button>
                      <Button variant="ghost" small onClick={() => setConfirmacao(a, "cancelou")}>Cancelou</Button>
                    </>
                  )}
                  <Button variant="ghost" small onClick={() => openEdit(a)}>Editar</Button>
                  <Button variant="danger" small onClick={() => remove(a.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Novo agendamento" : "Editar agendamento"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Paciente">
              <Select value={form.pacienteId} onChange={e => setForm({ ...form, pacienteId: e.target.value })}>
                <option value="">Selecione</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </Select>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Tipo">
                <Select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  {TIPOS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
                </Select>
              </Field>
              <Field label="Data"><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
              <Field label="Horário"><Input type="time" value={form.horario} onChange={e => setForm({ ...form, horario: e.target.value })} /></Field>
            </div>
            {excedeLimite && (
              <div style={{ background: C.brickSoft, color: C.brick, padding: "8px 12px", borderRadius: 8, fontFamily: FONT_BODY, fontSize: 12.5 }}>
                Esse horário já atingiu o limite configurado para {form.tipo}. Confirme se é um encaixe intencional.
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Status">
                <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="agendado">Agendado</option>
                  <option value="realizado">Realizado</option>
                  <option value="falta">Falta</option>
                  <option value="cancelado">Cancelado</option>
                </Select>
              </Field>
              <Field label="Tem direito à reposição?">
                <Select value={form.temReposicao ? "sim" : "nao"} onChange={e => setForm({ ...form, temReposicao: e.target.value === "sim" })}>
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </Select>
              </Field>
            </div>
            <Field label="Motivo da alteração / cancelamento (se houver)">
              <TextArea value={form.motivoAlteracao} onChange={e => setForm({ ...form, motivoAlteracao: e.target.value })} />
            </Field>
            {modal !== "new" && form.historico && form.historico.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.inkMuted, marginBottom: 4 }}>Histórico de alterações</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 120, overflowY: "auto" }}>
                  {form.historico.map((h, i) => <div key={i} style={{ fontSize: 12, color: C.inkMuted }}>• {h.acao}{h.motivo ? ` — ${h.motivo}` : ""}</div>)}
                </div>
              </div>
            )}
            <Button onClick={save} style={{ justifyContent: "center" }}>Salvar agendamento</Button>
          </div>
        </Modal>
      )}

      {showConfig && (
        <Modal title="Limite de vagas por horário" onClose={() => setShowConfig(false)} width={380}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 12.5, color: C.inkMuted, fontFamily: FONT_BODY }}>Simplificado no protótipo: um limite geral por tipo, aplicado a qualquer horário. No sistema final dá pra ter limite específico por horário.</div>
            <Field label="Vagas de Pilates por horário"><Input type="number" value={capacidade.pilates} onChange={e => persistCapacidade({ ...capacidade, pilates: e.target.value })} /></Field>
            <Field label="Vagas de Fisioterapia por horário"><Input type="number" value={capacidade.fisioterapia} onChange={e => persistCapacidade({ ...capacidade, fisioterapia: e.target.value })} /></Field>
            <Button onClick={() => setShowConfig(false)} style={{ justifyContent: "center" }}>Fechar</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   EVOLUÇÃO CLÍNICA — ficha completa (espelha a ficha em papel)
--------------------------------------------------------- */
const APARELHOS = ["Reformer", "Cadillac", "Step Chair", "Ladder Barrel", "Mat Pilates", "Spine Corrector"];
const ACESSORIOS = ["Theraband", "Bola", "Magic Circle", "Overball", "Toning Ball", "Bosu", "Disco proprioceptivo", "TRX", "Columpio", "Foam Roller"];
const REGIOES = ["Cervical", "Torácica", "Lombar", "Ombro", "Cotovelo", "Punho", "Quadril", "Joelho", "Tornozelo"];
const MM = ["MMSS", "MMII"];
const CADEIAS = ["Cadeia ant", "Cadeia post"];
const AQUECIMENTO = ["Pré-pilates", "Exercícios respiratórios", "Mobilizações ativas", "Alongamentos dinâmicos", "Organização corporal"];
const MOBILIDADE = ["Coluna", "Ombros", "Cotovelos", "Punhos", "Escápulas", "Quadris", "Joelhos", "Tornozelos"];
const ALONGAMENTOS = ["Cadeia anterior", "Cadeia posterior", "Cadeia lateral", "MMII", "MMSS", "Paravertebrais", "Abdominais", "Glúteos", "Piriforme", "Iliopsoas"];
const FORTALECIMENTO_GRUPOS = ["Flexores tronco", "Extensores tronco", "Rotadores tronco", "Flexores ombro", "Extensores ombro", "Rotadores ombro", "Flexores quadril", "Extensores quadril", "Rotadores quadril", "Flexores cotovelo", "Extensores cotovelo", "Flexores joelho", "Extensores joelho", "Flexores punho", "Extensores punho", "Dorsiflexores", "Plantiflexores"];
const REPS = ["8", "10", "12", "15"];
const RELAXAMENTO = ["Massagem manual", "Massagem elétrico", "Bola cravo", "Exercícios respiratórios"];
const OUTROS_TREINOS = ["Coordenação", "Respiratório", "Proprioceptivo", "Liberação miofascial", "Exerc. aéreos", "Equilíbrio"];

const emptySintoma = () => ({ marcado: false, regioes: [], dorIrradiada: false, dorTipos: [], outros: "" });

function toggleArr(arr, val) { return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]; }

function BlocoSintoma({ titulo, valor, onChange, comHigidez, comEncurtamento, comIntercorrencia }) {
  const set = (patch) => onChange({ ...valor, ...patch });
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkMuted, marginBottom: 4 }}>{titulo}</div>

      {comIntercorrencia && <Checkbox label="Sem intercorrências" checked={valor.semIntercorrencias} onChange={() => set({ semIntercorrencias: !valor.semIntercorrencias })} />}
      {comHigidez && <Checkbox label="Hígido" checked={valor.higido} onChange={() => set({ higido: !valor.higido })} />}

      <Checkbox label="Quadro álgico" checked={valor.marcado} onChange={() => set({ marcado: !valor.marcado })} />
      {valor.marcado && <div style={{ marginLeft: 22, marginBottom: 4 }}><CheckGroup options={REGIOES} values={valor.regioes} onToggle={(v) => set({ regioes: toggleArr(valor.regioes, v) })} columns={3} /></div>}

      <Checkbox label="Dor irradiada" checked={valor.dorIrradiada} onChange={() => set({ dorIrradiada: !valor.dorIrradiada })} />
      {valor.dorIrradiada && <div style={{ marginLeft: 22, marginBottom: 4 }}><CheckGroup options={MM} values={valor.dorTipos} onToggle={(v) => set({ dorTipos: toggleArr(valor.dorTipos, v) })} columns={2} /></div>}

      {comEncurtamento && (
        <>
          <Checkbox label="Encurtamento muscular" checked={valor.encurtamento} onChange={() => set({ encurtamento: !valor.encurtamento })} />
          {valor.encurtamento && <div style={{ marginLeft: 22, marginBottom: 4 }}><CheckGroup options={CADEIAS} values={valor.cadeias || []} onToggle={(v) => set({ cadeias: toggleArr(valor.cadeias || [], v) })} columns={2} /></div>}
        </>
      )}
      {comIntercorrencia && (
        <>
          <Checkbox label="Tontura" checked={valor.tontura} onChange={() => set({ tontura: !valor.tontura })} />
          <div style={{ display: "flex", gap: 16 }}>
            <Checkbox label="Elevação da P.A." checked={valor.elevacaoPA} onChange={() => set({ elevacaoPA: !valor.elevacaoPA })} />
            <Checkbox label="Redução da P.A." checked={valor.reducaoPA} onChange={() => set({ reducaoPA: !valor.reducaoPA })} />
          </div>
        </>
      )}
      <Input placeholder="Outros" value={valor.outros} onChange={e => set({ outros: e.target.value })} style={{ marginTop: 4 }} />
    </div>
  );
}

function BlocoComOutros({ titulo, options, values, onToggle, outros, onOutros, columns = 2 }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkMuted, marginBottom: 4 }}>{titulo}</div>
      <CheckGroup options={options} values={values} onToggle={onToggle} columns={columns} />
      <Input placeholder="Outros" value={outros} onChange={e => onOutros(e.target.value)} style={{ marginTop: 6 }} />
    </div>
  );
}

function EvolucaoForm({ pacienteId, user, onSave, onCancel }) {
  const [form, setForm] = useState({
    data: todayISO(),
    sinaisVitais: { aferido: "nao", pa: "", fc: "" },
    pre: { ...emptySintoma(), higido: false, encurtamento: false, cadeias: [] },
    intercorrencias: { ...emptySintoma(), semIntercorrencias: false, tontura: false, elevacaoPA: false, reducaoPA: false },
    pos: { ...emptySintoma(), higido: false },
    aparelhos: [], acessorios: [], acessoriosOutros: "",
    aquecimento: [], aquecimentoOutros: "",
    mobilidade: [], mobilidadeOutros: "",
    alongamentos: [], alongamentosOutros: "",
    fortalecimento: {}, fortalecimentoOutros: "",
    relaxamento: [], relaxamentoOutros: "",
    outrosTreinos: [], observacoes: "",
  });

  const toggleIn = (key, val) => setForm(f => ({ ...f, [key]: toggleArr(f[key], val) }));
  const toggleForte = (grupo, rep) => setForm(f => {
    const atual = f.fortalecimento[grupo] || { marcado: true, reps: [] };
    return { ...f, fortalecimento: { ...f.fortalecimento, [grupo]: { marcado: true, reps: toggleArr(atual.reps || [], rep) } } };
  });
  const desmarcarForte = (grupo) => setForm(f => ({ ...f, fortalecimento: { ...f.fortalecimento, [grupo]: { marcado: false, reps: [] } } }));

  const salvar = () => {
    onSave({ ...form, pacienteId, id: uid(), profissionalNome: user.nome, crefito: user.crefito || "" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Data do atendimento"><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
        <Field label="Aferição de sinais vitais">
          <Select value={form.sinaisVitais.aferido} onChange={e => setForm({ ...form, sinaisVitais: { ...form.sinaisVitais, aferido: e.target.value } })}>
            <option value="nao">Não</option><option value="sim">Sim</option>
          </Select>
        </Field>
      </div>
      {form.sinaisVitais.aferido === "sim" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="P.A. (mmHg)"><Input value={form.sinaisVitais.pa} onChange={e => setForm({ ...form, sinaisVitais: { ...form.sinaisVitais, pa: e.target.value } })} placeholder="Ex: 120/80" /></Field>
          <Field label="F.C. (bpm)"><Input value={form.sinaisVitais.fc} onChange={e => setForm({ ...form, sinaisVitais: { ...form.sinaisVitais, fc: e.target.value } })} /></Field>
        </div>
      )}

      <BlocoSintoma titulo="Pré-atendimento" valor={form.pre} onChange={(v) => setForm({ ...form, pre: v })} comHigidez comEncurtamento />
      <BlocoSintoma titulo="Intercorrências" valor={form.intercorrencias} onChange={(v) => setForm({ ...form, intercorrencias: v })} comIntercorrencia />
      <BlocoSintoma titulo="Pós-atendimento" valor={form.pos} onChange={(v) => setForm({ ...form, pos: v })} comHigidez />

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkMuted, marginBottom: 4 }}>Aparelhos utilizados</div>
        <CheckGroup options={APARELHOS} values={form.aparelhos} onToggle={(v) => toggleIn("aparelhos", v)} columns={2} />
      </div>
      <BlocoComOutros titulo="Acessórios utilizados" options={ACESSORIOS} values={form.acessorios} onToggle={(v) => toggleIn("acessorios", v)} outros={form.acessoriosOutros} onOutros={(v) => setForm({ ...form, acessoriosOutros: v })} columns={2} />

      <BlocoComOutros titulo="Aquecimento / Pré-pilates" options={AQUECIMENTO} values={form.aquecimento} onToggle={(v) => toggleIn("aquecimento", v)} outros={form.aquecimentoOutros} onOutros={(v) => setForm({ ...form, aquecimentoOutros: v })} columns={2} />
      <BlocoComOutros titulo="Mobilidade" options={MOBILIDADE} values={form.mobilidade} onToggle={(v) => toggleIn("mobilidade", v)} outros={form.mobilidadeOutros} onOutros={(v) => setForm({ ...form, mobilidadeOutros: v })} columns={2} />
      <BlocoComOutros titulo="Alongamentos" options={ALONGAMENTOS} values={form.alongamentos} onToggle={(v) => toggleIn("alongamentos", v)} outros={form.alongamentosOutros} onOutros={(v) => setForm({ ...form, alongamentosOutros: v })} columns={2} />

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkMuted, marginBottom: 4 }}>Fortalecimento</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {FORTALECIMENTO_GRUPOS.map(g => {
            const st = form.fortalecimento[g] || { marcado: false, reps: [] };
            return (
              <div key={g} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "2px 0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 13.5, minWidth: 160, cursor: "pointer" }}>
                  <input type="checkbox" checked={st.marcado} onChange={() => st.marcado ? desmarcarForte(g) : setForm(f => ({ ...f, fortalecimento: { ...f.fortalecimento, [g]: { marcado: true, reps: [] } } }))} style={{ width: 16, height: 16, accentColor: C.sage }} />
                  {g}
                </label>
                {st.marcado && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {REPS.map(r => (
                      <button key={r} type="button" onClick={() => toggleForte(g, r)} style={{
                        border: `1px solid ${st.reps.includes(r) ? C.sage : C.border}`,
                        background: st.reps.includes(r) ? C.sageSoft : "transparent",
                        color: st.reps.includes(r) ? C.sage : C.inkMuted,
                        borderRadius: 6, padding: "2px 8px", fontSize: 12, fontFamily: FONT_BODY, cursor: "pointer",
                      }}>{r}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Input placeholder="Outros" value={form.fortalecimentoOutros} onChange={e => setForm({ ...form, fortalecimentoOutros: e.target.value })} style={{ marginTop: 6 }} />
      </div>

      <BlocoComOutros titulo="Relaxamento" options={RELAXAMENTO} values={form.relaxamento} onToggle={(v) => toggleIn("relaxamento", v)} outros={form.relaxamentoOutros} onOutros={(v) => setForm({ ...form, relaxamentoOutros: v })} columns={2} />

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkMuted, marginBottom: 4 }}>Outros treinos / atividades complementares</div>
        <CheckGroup options={OUTROS_TREINOS} values={form.outrosTreinos} onToggle={(v) => toggleIn("outrosTreinos", v)} columns={2} />
      </div>

      <Field label="Observações"><TextArea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></Field>

      <div style={{ fontSize: 12.5, color: C.inkMuted, fontFamily: FONT_BODY }}>
        Assinatura: {user.nome} {user.crefito ? `— ${user.crefito}` : "(sem CREFITO cadastrado neste perfil)"}
      </div>

      <div style={{ display: "flex", gap: 8, position: "sticky", bottom: 0, background: C.surface, paddingTop: 10 }}>
        <Button onClick={salvar} style={{ flex: 1, justifyContent: "center" }}>Salvar evolução</Button>
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   PACIENTES (cadastro + anamnese + evoluções + financeiro individual)
--------------------------------------------------------- */
function Pacientes({ pacientes, persist, evolucoes, persistEvolucoes, anamneses, persistAnamneses, user }) {
  const [modal, setModal] = useState(null);
  const [detalheId, setDetalheId] = useState(null);
  const [filtro, setFiltro] = useState("");
  const emptyForm = {
    nome: "", cpf: "", nascimento: "", telefone: "", endereco: "", profissao: "", peso: "", altura: "",
    status: "ativo", dataInativacao: "", autorizouImagem: "nao", dataAssinaturaImagem: "",
    valorMensalidade: "", vencimento: todayISO(), statusPagamento: "pendente", dataPagamento: "", formaPagamento: "",
    proximaAvaliacao: "",
  };
  const [form, setForm] = useState(emptyForm);

  const openNew = () => { setForm(emptyForm); setModal("new"); };
  const openEdit = (p) => { setForm(p); setModal(p.id); };
  const save = () => {
    if (!form.nome.trim()) return;
    if (modal === "new") persist([...pacientes, { ...form, id: uid() }]);
    else persist(pacientes.map(p => p.id === modal ? { ...form, id: modal } : p));
    setModal(null);
  };
  const remove = (id) => persist(pacientes.filter(p => p.id !== id));

  const listaFiltrada = pacientes.filter(p => p.nome.toLowerCase().includes(filtro.toLowerCase()));
  const detalhe = pacientes.find(p => p.id === detalheId);

  if (detalhe) return (
    <PacienteDetalhe
      paciente={detalhe} onBack={() => setDetalheId(null)} onEdit={() => { openEdit(detalhe); }}
      evolucoes={evolucoes.filter(e => e.pacienteId === detalhe.id)} persistEvolucoes={persistEvolucoes} evolucoesTodas={evolucoes}
      anamnese={anamneses.find(a => a.pacienteId === detalhe.id)} persistAnamneses={persistAnamneses} anamnesesTodas={anamneses}
      user={user}
    />
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <SectionTitle>Pacientes</SectionTitle>
        <div style={{ display: "flex", gap: 10 }}>
          <Input placeholder="Buscar..." value={filtro} onChange={e => setFiltro(e.target.value)} style={{ width: 180 }} />
          <Button onClick={openNew}><Plus size={16} /> Novo paciente</Button>
        </div>
      </div>

      {listaFiltrada.length === 0 && <Empty icon={Users} text="Nenhum paciente cadastrado ainda." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {listaFiltrada.map(p => {
          const vencido = p.vencimento && p.vencimento < todayISO() && p.statusPagamento !== "pago" && p.status !== "inativo";
          return (
            <Card key={p.id} style={{ padding: 16, cursor: "pointer" }} onClick={() => setDetalheId(p.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 15, color: C.ink }}>{p.nome}</span>
                    {p.status === "inativo" && <Badge tone="brick">Inativo</Badge>}
                    {vencido && <Badge tone="brick">Vencido</Badge>}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkMuted, marginTop: 4 }}>
                    {idade(p.nascimento)} anos · {p.telefone || "sem telefone"} · mensalidade {fmtMoney(p.valorMensalidade)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" small onClick={() => openEdit(p)}>Editar</Button>
                  <Button variant="danger" small onClick={() => remove(p.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Novo paciente" : "Editar paciente"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Nome completo"><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="CPF"><Input value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} /></Field>
              <Field label="Data de nascimento"><Input type="date" value={form.nascimento} onChange={e => setForm({ ...form, nascimento: e.target.value })} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Telefone"><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></Field>
              <Field label="Profissão"><Input value={form.profissao} onChange={e => setForm({ ...form, profissao: e.target.value })} /></Field>
            </div>
            <Field label="Endereço"><Input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Peso (kg)"><Input type="number" value={form.peso} onChange={e => setForm({ ...form, peso: e.target.value })} /></Field>
              <Field label="Altura (cm)"><Input type="number" value={form.altura} onChange={e => setForm({ ...form, altura: e.target.value })} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Situação">
                <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="ativo">Ativo</option><option value="inativo">Inativo</option>
                </Select>
              </Field>
              {form.status === "inativo" && <Field label="Data da inativação"><Input type="date" value={form.dataInativacao} onChange={e => setForm({ ...form, dataInativacao: e.target.value })} /></Field>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Autorizou uso de imagem?">
                <Select value={form.autorizouImagem} onChange={e => setForm({ ...form, autorizouImagem: e.target.value })}>
                  <option value="nao">Não</option><option value="sim">Sim</option>
                </Select>
              </Field>
              {form.autorizouImagem === "sim" && <Field label="Data da assinatura"><Input type="date" value={form.dataAssinaturaImagem} onChange={e => setForm({ ...form, dataAssinaturaImagem: e.target.value })} /></Field>}
            </div>
            <div style={{ fontSize: 12, color: C.inkMuted }}>Upload do termo assinado: no protótipo, anexe o PDF direto na pasta do paciente fora do sistema por enquanto — upload de arquivo entra na versão final.</div>

            <SpringDivider width={60} />
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Mensalidade</div>
            {user.nivel !== "total" && (
              <div style={{ fontSize: 12, color: C.brass, background: C.brassSoft, padding: "8px 12px", borderRadius: 8 }}>
                Valor e desconto de mensalidade só podem ser alterados pela Dani proprietária.
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Valor">
                <Input type="number" value={form.valorMensalidade} disabled={user.nivel !== "total"}
                  onChange={e => setForm({ ...form, valorMensalidade: e.target.value })}
                  style={user.nivel !== "total" ? { opacity: 0.6, cursor: "not-allowed" } : {}} />
              </Field>
              <Field label="Vencimento"><Input type="date" value={form.vencimento} onChange={e => setForm({ ...form, vencimento: e.target.value })} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Situação do pagamento">
                <Select value={form.statusPagamento} onChange={e => setForm({ ...form, statusPagamento: e.target.value })}>
                  <option value="pendente">Pendente</option><option value="pago">Pago</option>
                </Select>
              </Field>
              <Field label="Forma de pagamento"><Input value={form.formaPagamento} onChange={e => setForm({ ...form, formaPagamento: e.target.value })} placeholder="Pix, cartão..." /></Field>
            </div>
            <Field label="Próxima reavaliação (opcional)"><Input type="date" value={form.proximaAvaliacao} onChange={e => setForm({ ...form, proximaAvaliacao: e.target.value })} /></Field>

            <Button onClick={save} style={{ justifyContent: "center" }}>Salvar paciente</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PacienteDetalhe({ paciente, onBack, evolucoes, persistEvolucoes, evolucoesTodas, anamnese, persistAnamneses, anamnesesTodas, user }) {
  const [aba, setAba] = useState("dados");
  const [novaEvolucao, setNovaEvolucao] = useState(false);
  const [textoAnamnese, setTextoAnamnese] = useState(anamnese ? anamnese.texto : "");

  const podeVerClinico = user.nivel === "total" || user.nivel === "fisio"; // Dani Souza (gerencial) não acessa dados clínicos

  const salvarAnamnese = () => {
    if (anamnese) persistAnamneses(anamnesesTodas.map(a => a.id === anamnese.id ? { ...a, texto: textoAnamnese, atualizadoEm: todayISO() } : a));
    else persistAnamneses([...anamnesesTodas, { id: uid(), pacienteId: paciente.id, texto: textoAnamnese, atualizadoEm: todayISO() }]);
  };

  const salvarEvolucao = (ev) => { persistEvolucoes([...evolucoesTodas, ev]); setNovaEvolucao(false); };

  const abas = [
    { k: "dados", label: "Dados pessoais" },
    ...(podeVerClinico ? [{ k: "anamnese", label: "Anamnese" }, { k: "evolucoes", label: "Evoluções" }] : []),
    { k: "financeiro", label: "Financeiro" },
  ];

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.inkMuted, fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer", marginBottom: 14 }}>
        <ArrowLeft size={15} /> Voltar
      </button>
      <SectionTitle>{paciente.nome}</SectionTitle>

      <div style={{ display: "flex", gap: 4, margin: "16px 0", borderBottom: `1px solid ${C.border}` }}>
        {abas.map(a => (
          <button key={a.k} onClick={() => setAba(a.k)} style={{ background: "none", border: "none", padding: "9px 12px", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: aba === a.k ? C.sage : C.inkMuted, borderBottom: aba === a.k ? `2px solid ${C.sage}` : "2px solid transparent", cursor: "pointer" }}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === "dados" && (
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontFamily: FONT_BODY, fontSize: 14 }}>
            <div><b>CPF:</b> {paciente.cpf || "—"}</div>
            <div><b>Nascimento:</b> {fmtDate(paciente.nascimento)} ({idade(paciente.nascimento)} anos)</div>
            <div><b>Telefone:</b> {paciente.telefone || "—"}</div>
            <div><b>Profissão:</b> {paciente.profissao || "—"}</div>
            <div><b>Endereço:</b> {paciente.endereco || "—"}</div>
            <div><b>Peso/Altura:</b> {paciente.peso || "—"}kg / {paciente.altura || "—"}cm</div>
            <div><b>Situação:</b> {paciente.status}</div>
            <div><b>Uso de imagem:</b> {paciente.autorizouImagem === "sim" ? `Autorizado em ${fmtDate(paciente.dataAssinaturaImagem)}` : "Não autorizado"}</div>
          </div>
        </Card>
      )}

      {aba === "anamnese" && podeVerClinico && (
        <Card>
          <Field label="Ficha de anamnese (histórico clínico do paciente)">
            <TextArea value={textoAnamnese} onChange={e => setTextoAnamnese(e.target.value)} style={{ minHeight: 200 }} />
          </Field>
          {anamnese && <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 6 }}>Última atualização: {fmtDate(anamnese.atualizadoEm)}</div>}
          <Button onClick={salvarAnamnese} style={{ marginTop: 12 }}>Salvar anamnese</Button>
        </Card>
      )}

      {aba === "evolucoes" && podeVerClinico && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Button onClick={() => setNovaEvolucao(true)}><Plus size={16} /> Nova evolução</Button>
          </div>
          {evolucoes.length === 0 && <Empty icon={ClipboardList} text="Nenhuma evolução registrada ainda." />}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...evolucoes].sort((a, b) => b.data.localeCompare(a.data)).map(e => (
              <Card key={e.id} style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <b style={{ fontFamily: FONT_BODY, fontSize: 14 }}>{fmtDate(e.data)}</b>
                  <span style={{ fontSize: 12, color: C.inkMuted }}>{e.profissionalNome} {e.crefito}</span>
                </div>
                <div style={{ fontSize: 12.5, color: C.inkMuted, marginTop: 6 }}>
                  {e.sinaisVitais && e.sinaisVitais.aferido === "sim" && <>Sinais vitais: PA {e.sinaisVitais.pa || "—"} · FC {e.sinaisVitais.fc || "—"} <br /></>}
                  Pré: {resumoSintoma(e.pre)} <br />
                  Intercorrências: {resumoSintoma(e.intercorrencias)} <br />
                  Pós: {resumoSintoma(e.pos)} <br />
                  Aparelhos: {(e.aparelhos || []).join(", ") || "—"} · Acessórios: {(e.acessorios || []).join(", ") || "—"}
                </div>
                {e.observacoes && <div style={{ fontSize: 12.5, marginTop: 6, fontStyle: "italic" }}>{e.observacoes}</div>}
              </Card>
            ))}
          </div>
          {novaEvolucao && (
            <Modal title="Nova evolução clínica" onClose={() => setNovaEvolucao(false)} width={640}>
              <EvolucaoForm pacienteId={paciente.id} user={user} onSave={salvarEvolucao} onCancel={() => setNovaEvolucao(false)} />
            </Modal>
          )}
        </div>
      )}

      {aba === "financeiro" && (
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontFamily: FONT_BODY, fontSize: 14 }}>
            <div><b>Mensalidade:</b> {fmtMoney(paciente.valorMensalidade)}</div>
            <div><b>Vencimento:</b> {fmtDate(paciente.vencimento)}</div>
            <div><b>Situação:</b> <Badge tone={paciente.statusPagamento === "pago" ? "sage" : "brick"}>{paciente.statusPagamento}</Badge></div>
            <div><b>Forma de pagamento:</b> {paciente.formaPagamento || "—"}</div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   FINANCEIRO (mensalidades + caixa)
--------------------------------------------------------- */
function Financeiro({ pacientes, persistPacientes, caixa, persistCaixa, user }) {
  const podeVerGeral = user.nivel === "total";
  const [modal, setModal] = useState(false);
  const emptyForm = { tipo: "entrada", descricao: "", valor: "", data: todayISO() };
  const [form, setForm] = useState(emptyForm);
  const [mes, setMes] = useState(todayISO().slice(0, 7));

  const marcarPago = (p) => {
    const prox = new Date(todayISO()); prox.setMonth(prox.getMonth() + 1);
    persistPacientes(pacientes.map(x => x.id === p.id ? { ...x, statusPagamento: "pago", dataPagamento: todayISO(), vencimento: prox.toISOString().slice(0, 10) } : x));
    persistCaixa([...caixa, { id: uid(), tipo: "entrada", descricao: `Mensalidade — ${p.nome}`, valor: p.valorMensalidade || 0, data: todayISO() }]);
  };

  const save = () => { if (!form.descricao.trim() || !form.valor) return; persistCaixa([...caixa, { ...form, id: uid() }]); setForm(emptyForm); setModal(false); };
  const remove = (id) => persistCaixa(caixa.filter(c => c.id !== id));

  const doMes = caixa.filter(c => c.data.startsWith(mes)).sort((a, b) => b.data.localeCompare(a.data));
  const entradas = doMes.filter(c => c.tipo === "entrada").reduce((s, c) => s + Number(c.valor), 0);
  const saidas = doMes.filter(c => c.tipo === "saida").reduce((s, c) => s + Number(c.valor), 0);
  const inadimplentes = pacientes.filter(p => p.vencimento < todayISO() && p.statusPagamento !== "pago" && p.status !== "inativo");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <SectionTitle>Financeiro</SectionTitle>
        <div style={{ display: "flex", gap: 8 }}>
          {podeVerGeral && <Input type="month" value={mes} onChange={e => setMes(e.target.value)} />}
          {podeVerGeral && <Button onClick={() => { setForm(emptyForm); setModal(true); }}><Plus size={16} /> Lançamento</Button>}
        </div>
      </div>

      {!podeVerGeral && (
        <div style={{ background: C.brassSoft, color: C.brass, padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontFamily: FONT_BODY, marginBottom: 16 }}>
          Lucro, saldo do caixa e lançamentos gerais são visíveis apenas para a Dani proprietária. Aqui você acompanha e cobra as mensalidades pendentes.
        </div>
      )}

      {podeVerGeral && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 20 }}>
          <Card style={{ padding: 16 }}><div style={{ fontSize: 12, color: C.inkMuted }}>Entradas</div><div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.sage }}>{fmtMoney(entradas)}</div></Card>
          <Card style={{ padding: 16 }}><div style={{ fontSize: 12, color: C.inkMuted }}>Saídas</div><div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.brick }}>{fmtMoney(saidas)}</div></Card>
          <Card style={{ padding: 16 }}><div style={{ fontSize: 12, color: C.inkMuted }}>Saldo</div><div style={{ fontFamily: FONT_DISPLAY, fontSize: 22 }}>{fmtMoney(entradas - saidas)}</div></Card>
          <Card style={{ padding: 16 }}><div style={{ fontSize: 12, color: C.inkMuted }}>Inadimplentes</div><div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.brick }}>{inadimplentes.length}</div></Card>
        </div>
      )}
      {!podeVerGeral && (
        <div style={{ marginBottom: 20 }}>
          <Card style={{ padding: 16, display: "inline-block" }}><div style={{ fontSize: 12, color: C.inkMuted }}>Inadimplentes</div><div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.brick }}>{inadimplentes.length}</div></Card>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, fontFamily: FONT_BODY }}>Mensalidades pendentes</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {inadimplentes.length === 0 && <div style={{ fontSize: 13, color: C.inkMuted, fontFamily: FONT_BODY }}>Nenhuma pendência.</div>}
        {inadimplentes.map(p => (
          <Card key={p.id} style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5 }}>{p.nome} — vencido em {fmtDate(p.vencimento)} · {fmtMoney(p.valorMensalidade)}</div>
            <Button small onClick={() => marcarPago(p)}><Check size={14} /> Marcar pago</Button>
          </Card>
        ))}
      </div>

      {podeVerGeral && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, fontFamily: FONT_BODY }}>Caixa do mês</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {doMes.length === 0 && <Empty icon={Wallet} text="Nenhum lançamento neste mês." />}
            {doMes.map(c => (
              <Card key={c.id} style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {c.tipo === "entrada" ? <TrendingUp size={16} color={C.sage} /> : <TrendingDown size={16} color={C.brick} />}
                  <div><div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14 }}>{c.descricao}</div><div style={{ fontSize: 12, color: C.inkMuted }}>{fmtDate(c.data)}</div></div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: c.tipo === "entrada" ? C.sage : C.brick, fontFamily: FONT_BODY }}>{c.tipo === "entrada" ? "+" : "−"} {fmtMoney(c.valor)}</span>
                  <Button variant="danger" small onClick={() => remove(c.id)}><Trash2 size={14} /></Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {modal && (
        <Modal title="Novo lançamento" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Tipo"><Select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}><option value="entrada">Entrada</option><option value="saida">Saída</option></Select></Field>
            <Field label="Descrição"><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Valor"><Input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></Field>
              <Field label="Data"><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
            </div>
            <Button onClick={save} style={{ justifyContent: "center" }}>Salvar lançamento</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   QUIROPRAXIA (comissão automática 30/70)
--------------------------------------------------------- */
function Quiropraxia({ atendimentos, persist, pacientes, user }) {
  const [modal, setModal] = useState(false);
  const emptyForm = { pacienteId: "", data: todayISO(), valorPago: "" };
  const [form, setForm] = useState(emptyForm);
  const [mes, setMes] = useState(todayISO().slice(0, 7));

  const save = () => {
    if (!form.pacienteId || !form.valorPago) return;
    const paciente = pacientes.find(p => p.id === form.pacienteId);
    const valor = Number(form.valorPago);
    persist([...atendimentos, {
      id: uid(), pacienteId: form.pacienteId, pacienteNome: paciente ? paciente.nome : "", data: form.data,
      valorPago: valor, comissaoFraciele: +(valor * 0.3).toFixed(2), valorStudio: +(valor * 0.7).toFixed(2),
    }]);
    setForm(emptyForm); setModal(false);
  };
  const remove = (id) => persist(atendimentos.filter(a => a.id !== id));

  const doMes = atendimentos.filter(a => a.data.startsWith(mes)).sort((a, b) => b.data.localeCompare(a.data));
  const totalPago = doMes.reduce((s, a) => s + a.valorPago, 0);
  const totalComissao = doMes.reduce((s, a) => s + a.comissaoFraciele, 0);
  const totalStudio = doMes.reduce((s, a) => s + a.valorStudio, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <SectionTitle>Quiropraxia — Franciele</SectionTitle>
        <div style={{ display: "flex", gap: 8 }}>
          <Input type="month" value={mes} onChange={e => setMes(e.target.value)} />
          <Button onClick={() => { setForm(emptyForm); setModal(true); }}><Plus size={16} /> Registrar atendimento</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 20 }}>
        <Card style={{ padding: 16 }}><div style={{ fontSize: 12, color: C.inkMuted }}>Total recebido</div><div style={{ fontFamily: FONT_DISPLAY, fontSize: 22 }}>{fmtMoney(totalPago)}</div></Card>
        <Card style={{ padding: 16 }}><div style={{ fontSize: 12, color: C.inkMuted }}>Comissão Franciele (30%)</div><div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.brass }}>{fmtMoney(totalComissao)}</div></Card>
        <Card style={{ padding: 16 }}><div style={{ fontSize: 12, color: C.inkMuted }}>Líquido Studio (70%)</div><div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.sage }}>{fmtMoney(totalStudio)}</div></Card>
      </div>

      {doMes.length === 0 && <Empty icon={Stethoscope} text="Nenhum atendimento registrado neste mês." />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {doMes.map(a => (
          <Card key={a.id} style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14 }}>{a.pacienteNome}</div>
              <div style={{ fontSize: 12, color: C.inkMuted }}>{fmtDate(a.data)} · pago {fmtMoney(a.valorPago)} · comissão {fmtMoney(a.comissaoFraciele)} · studio {fmtMoney(a.valorStudio)}</div>
            </div>
            {user.nivel === "total" && <Button variant="danger" small onClick={() => remove(a.id)}><Trash2 size={14} /></Button>}
          </Card>
        ))}
      </div>

      {modal && (
        <Modal title="Registrar atendimento de quiropraxia" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Paciente">
              <Select value={form.pacienteId} onChange={e => setForm({ ...form, pacienteId: e.target.value })}>
                <option value="">Selecione</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </Select>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Data"><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
              <Field label="Valor pago"><Input type="number" value={form.valorPago} onChange={e => setForm({ ...form, valorPago: e.target.value })} /></Field>
            </div>
            {form.valorPago && (
              <div style={{ fontSize: 12.5, color: C.inkMuted }}>
                Comissão (30%): {fmtMoney(Number(form.valorPago) * 0.3)} · Studio (70%): {fmtMoney(Number(form.valorPago) * 0.7)}
              </div>
            )}
            <Button onClick={save} style={{ justifyContent: "center" }}>Salvar</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   COMUNICAÇÃO (log simulado — sem integração real de WhatsApp/SMS)
--------------------------------------------------------- */
function Comunicacao({ agenda, pacientes, mensagens, persist }) {
  const proximos = agenda.filter(a => a.data >= todayISO() && a.confirmacao === "pendente" && a.status === "agendado").sort((a, b) => a.data.localeCompare(b.data));
  const [form, setForm] = useState({ pacienteId: "", tipo: "lembrete" });

  const enviar = (pacienteId, tipo, contexto) => {
    const paciente = pacientes.find(p => p.id === pacienteId);
    persist([{ id: uid(), pacienteNome: paciente ? paciente.nome : "", tipo, data: new Date().toISOString(), contexto }, ...mensagens]);
  };

  const enviarManual = () => {
    if (!form.pacienteId) return;
    enviar(form.pacienteId, form.tipo, "Envio manual");
    setForm({ pacienteId: "", tipo: "lembrete" });
  };

  return (
    <div>
      <SectionTitle>Comunicação</SectionTitle>
      <div style={{ fontSize: 12.5, color: C.inkMuted, margin: "8px 0 18px", fontFamily: FONT_BODY }}>
        Protótipo: aqui só registramos o envio (simulado). A ligação real com WhatsApp/SMS via um número oficial da clínica entra na versão de produção.
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, fontFamily: FONT_BODY }}>Enviar mensagem</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 10 }}>
          <Select value={form.pacienteId} onChange={e => setForm({ ...form, pacienteId: e.target.value })}>
            <option value="">Selecione o paciente</option>
            {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </Select>
          <Select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
            <option value="confirmacao">Confirmação de consulta</option>
            <option value="lembrete">Lembrete de atendimento</option>
            <option value="pagamento">Aviso de pagamento</option>
            <option value="avaliacao">Aviso de nova avaliação</option>
          </Select>
          <Button onClick={enviarManual}>Enviar</Button>
        </div>
      </Card>

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, fontFamily: FONT_BODY }}>Confirmações pendentes (próximos atendimentos)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {proximos.length === 0 && <div style={{ fontSize: 13, color: C.inkMuted, fontFamily: FONT_BODY }}>Nenhuma pendência.</div>}
        {proximos.map(a => (
          <Card key={a.id} style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5 }}>{a.pacienteNome} — {fmtDate(a.data)} {a.horario}</div>
            <Button small onClick={() => enviar(a.pacienteId, "confirmacao", "Confirmação automática de agendamento")}>Enviar lembrete</Button>
          </Card>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, fontFamily: FONT_BODY }}>Histórico de envios</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {mensagens.length === 0 && <Empty icon={MessageCircle} text="Nenhuma mensagem enviada ainda." />}
        {mensagens.slice(0, 30).map(m => (
          <div key={m.id} style={{ fontSize: 12.5, color: C.inkMuted, fontFamily: FONT_BODY, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
            {new Date(m.data).toLocaleString("pt-BR")} · {m.pacienteNome} · {m.tipo} — {m.contexto}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   COMPRAS & SUPRIMENTOS
--------------------------------------------------------- */
const CATEGORIAS_COMPRA = ["Limpeza", "Escritório", "Equipamentos", "Manutenção", "Consumo", "Outros"];
const URGENCIAS = ["Baixa", "Média", "Alta"];
const STATUS_COMPRA = ["Pendente", "Alteração solicitada", "Aprovado", "Rejeitado", "Comprado", "Entregue", "Cancelado"];
const STATUS_TONE = { "Pendente": "brass", "Alteração solicitada": "brass", "Aprovado": "sage", "Rejeitado": "brick", "Comprado": "teal", "Entregue": "sage", "Cancelado": "brick" };
const STATUS_BOLINHA = { "Pendente": "🟡", "Alteração solicitada": "🟡", "Aprovado": "🟢", "Rejeitado": "🔴", "Comprado": "🔵", "Entregue": "⚫", "Cancelado": "🔴" };

function Compras({ compras, persist, estoque, persistEstoque, caixa, persistCaixa, user }) {
  const podeAprovar = user.nivel === "total" || user.nivel === "gerencial";
  const [modal, setModal] = useState(null); // null | 'new' | compra selecionada pra aprovar
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const emptyForm = { produto: "", categoria: "Consumo", quantidade: 1, valorEstimado: "", fornecedor: "", justificativa: "", urgencia: "Média" };
  const [form, setForm] = useState(emptyForm);
  const [aprovForm, setAprovForm] = useState({ valorAprovado: "", fornecedorEscolhido: "", dataPrevista: "" });
  const [motivoAlteracao, setMotivoAlteracao] = useState("");
  const [showEstoque, setShowEstoque] = useState(false);

  const salvarSolicitacao = () => {
    if (!form.produto.trim()) return;
    persist([...compras, { ...form, id: uid(), solicitante: user.nome, dataSolicitacao: todayISO(), status: "Pendente" }]);
    setForm(emptyForm); setModal(null);
  };

  const abrirAprovacao = (c) => { setAprovForm({ valorAprovado: c.valorEstimado, fornecedorEscolhido: c.fornecedor || "", dataPrevista: todayISO() }); setModal(c.id); };
  const aprovar = () => {
    persist(compras.map(c => c.id === modal ? { ...c, status: "Aprovado", ...aprovForm } : c));
    setModal(null);
  };
  const rejeitar = (c) => persist(compras.map(x => x.id === c.id ? { ...x, status: "Rejeitado" } : x));
  const solicitarAlteracao = () => {
    persist(compras.map(c => c.id === modal ? { ...c, status: "Alteração solicitada", motivoAlteracao } : c));
    setMotivoAlteracao(""); setModal(null);
  };
  const cancelar = (c) => persist(compras.map(x => x.id === c.id ? { ...x, status: "Cancelado" } : x));

  const marcarComprado = (c) => {
    persist(compras.map(x => x.id === c.id ? { ...x, status: "Comprado", dataCompra: todayISO() } : x));
    persistCaixa([...caixa, { id: uid(), tipo: "saida", descricao: `Compra — ${c.produto}`, valor: c.valorAprovado || c.valorEstimado || 0, data: todayISO() }]);
  };
  const marcarEntregue = (c) => persist(compras.map(x => x.id === c.id ? { ...x, status: "Entregue" } : x));

  const grupos = {
    "🟡 Pendentes": compras.filter(c => c.status === "Pendente" || c.status === "Alteração solicitada"),
    "🟢 Aprovadas": compras.filter(c => c.status === "Aprovado"),
    "🔵 Compradas": compras.filter(c => c.status === "Comprado"),
    "⚫ Finalizadas": compras.filter(c => c.status === "Entregue"),
  };
  const listaVisivel = filtroStatus === "todos" ? compras : compras.filter(c => c.status === filtroStatus);

  const mesAtual = todayISO().slice(0, 7);
  const previstoMes = compras.filter(c => c.dataSolicitacao.startsWith(mesAtual) && !["Rejeitado", "Cancelado"].includes(c.status)).reduce((s, c) => s + Number(c.valorAprovado || c.valorEstimado || 0), 0);
  const gastoMes = compras.filter(c => c.dataCompra && c.dataCompra.startsWith(mesAtual)).reduce((s, c) => s + Number(c.valorAprovado || c.valorEstimado || 0), 0);

  const compraModal = compras.find(c => c.id === modal);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <SectionTitle>Compras & Suprimentos</SectionTitle>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" onClick={() => setShowEstoque(true)}><Package size={16} /> Estoque</Button>
          <Button onClick={() => { setForm(emptyForm); setModal("new"); }}><Plus size={16} /> Solicitar compra</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 20 }}>
        <Card style={{ padding: 16 }}><div style={{ fontSize: 12, color: C.inkMuted }}>Aguardando aprovação</div><div style={{ fontFamily: FONT_DISPLAY, fontSize: 22 }}>{grupos["🟡 Pendentes"].length}</div></Card>
        <Card style={{ padding: 16 }}><div style={{ fontSize: 12, color: C.inkMuted }}>Aprovadas</div><div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.sage }}>{grupos["🟢 Aprovadas"].length}</div></Card>
        <Card style={{ padding: 16 }}><div style={{ fontSize: 12, color: C.inkMuted }}>Previsto no mês</div><div style={{ fontFamily: FONT_DISPLAY, fontSize: 22 }}>{fmtMoney(previstoMes)}</div></Card>
        <Card style={{ padding: 16 }}><div style={{ fontSize: 12, color: C.inkMuted }}>Gasto no mês</div><div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.brick }}>{fmtMoney(gastoMes)}</div></Card>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <Button variant={filtroStatus === "todos" ? "primary" : "ghost"} small onClick={() => setFiltroStatus("todos")}>Todos</Button>
        {Object.keys(grupos).map(g => (
          <Button key={g} variant="ghost" small onClick={() => setFiltroStatus(g.includes("Pendentes") ? "Pendente" : g.includes("Aprovadas") ? "Aprovado" : g.includes("Compradas") ? "Comprado" : "Entregue")}>{g} ({grupos[g].length})</Button>
        ))}
      </div>

      {listaVisivel.length === 0 && <Empty icon={ShoppingCart} text="Nenhuma solicitação de compra por aqui." />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {listaVisivel.map(c => (
          <Card key={c.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14.5, color: C.ink }}>{STATUS_BOLINHA[c.status]} {c.produto}</span>
                  <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  <Badge tone="brass">{c.categoria}</Badge>
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkMuted, marginTop: 4 }}>
                  {c.solicitante} · {fmtDate(c.dataSolicitacao)} · qtd {c.quantidade} · estimado {fmtMoney(c.valorEstimado)} {c.valorAprovado ? `· aprovado ${fmtMoney(c.valorAprovado)}` : ""} · urgência {c.urgencia}
                </div>
                {c.justificativa && <div style={{ fontSize: 12.5, color: C.inkMuted, marginTop: 2, fontStyle: "italic" }}>{c.justificativa}</div>}
                {c.motivoAlteracao && <div style={{ fontSize: 12.5, color: C.brass, marginTop: 2 }}>Alteração pedida: {c.motivoAlteracao}</div>}
              </div>
              {podeAprovar && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start" }}>
                  {c.status === "Pendente" && (
                    <>
                      <Button small onClick={() => abrirAprovacao(c)}>Aprovar</Button>
                      <Button variant="ghost" small onClick={() => { setModal(c.id); }}>Pedir alteração</Button>
                      <Button variant="danger" small onClick={() => rejeitar(c)}>Rejeitar</Button>
                    </>
                  )}
                  {c.status === "Aprovado" && <Button small onClick={() => marcarComprado(c)}>Compra realizada</Button>}
                  {c.status === "Comprado" && <Button small onClick={() => marcarEntregue(c)}>Marcar entregue</Button>}
                  {!["Cancelado", "Entregue", "Rejeitado"].includes(c.status) && <Button variant="ghost" small onClick={() => cancelar(c)}>Cancelar</Button>}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {modal === "new" && (
        <Modal title="Solicitar compra" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Produto"><Input value={form.produto} onChange={e => setForm({ ...form, produto: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Categoria"><Select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>{CATEGORIAS_COMPRA.map(c => <option key={c} value={c}>{c}</option>)}</Select></Field>
              <Field label="Urgência"><Select value={form.urgencia} onChange={e => setForm({ ...form, urgencia: e.target.value })}>{URGENCIAS.map(u => <option key={u} value={u}>{u}</option>)}</Select></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Quantidade"><Input type="number" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} /></Field>
              <Field label="Valor estimado"><Input type="number" value={form.valorEstimado} onChange={e => setForm({ ...form, valorEstimado: e.target.value })} /></Field>
            </div>
            <Field label="Fornecedor (opcional)"><Input value={form.fornecedor} onChange={e => setForm({ ...form, fornecedor: e.target.value })} /></Field>
            <Field label="Justificativa"><TextArea value={form.justificativa} onChange={e => setForm({ ...form, justificativa: e.target.value })} /></Field>
            <div style={{ fontSize: 12, color: C.inkMuted }}>Solicitante: {user.nome} · Data: {fmtDate(todayISO())}</div>
            <Button onClick={salvarSolicitacao} style={{ justifyContent: "center" }}>Enviar solicitação</Button>
          </div>
        </Modal>
      )}

      {compraModal && compraModal.status === "Pendente" && (
        <Modal title={`Analisar: ${compraModal.produto}`} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 13, color: C.inkMuted }}>{compraModal.justificativa}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Aprovar com:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Valor aprovado"><Input type="number" value={aprovForm.valorAprovado} onChange={e => setAprovForm({ ...aprovForm, valorAprovado: e.target.value })} /></Field>
              <Field label="Data prevista da compra"><Input type="date" value={aprovForm.dataPrevista} onChange={e => setAprovForm({ ...aprovForm, dataPrevista: e.target.value })} /></Field>
            </div>
            <Field label="Fornecedor escolhido"><Input value={aprovForm.fornecedorEscolhido} onChange={e => setAprovForm({ ...aprovForm, fornecedorEscolhido: e.target.value })} /></Field>
            <Button onClick={aprovar} style={{ justifyContent: "center" }}>Aprovar solicitação</Button>
            <SpringDivider width={50} />
            <Field label="Ou pedir alteração (motivo)"><TextArea value={motivoAlteracao} onChange={e => setMotivoAlteracao(e.target.value)} /></Field>
            <Button variant="ghost" onClick={solicitarAlteracao} style={{ justifyContent: "center" }}>Solicitar alteração ao solicitante</Button>
          </div>
        </Modal>
      )}

      {showEstoque && (
        <Modal title="Controle de estoque" onClose={() => setShowEstoque(false)} width={480}>
          <EstoqueMini estoque={estoque} persist={persistEstoque} podeEditar={podeAprovar} />
        </Modal>
      )}
    </div>
  );
}

function EstoqueMini({ estoque, persist, podeEditar }) {
  const [novo, setNovo] = useState({ produto: "", quantidadeAtual: "", quantidadeMinima: "" });
  const add = () => { if (!novo.produto.trim()) return; persist([...estoque, { ...novo, id: uid() }]); setNovo({ produto: "", quantidadeAtual: "", quantidadeMinima: "" }); };
  const ajustar = (id, delta) => persist(estoque.map(e => e.id === id ? { ...e, quantidadeAtual: Math.max(0, Number(e.quantidadeAtual) + delta) } : e));
  const remove = (id) => persist(estoque.filter(e => e.id !== id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: C.inkMuted }}>Opcional: acompanhe o essencial (álcool, papel toalha, faixas...) e receba aviso quando estiver baixo.</div>
      {estoque.map(e => {
        const baixo = Number(e.quantidadeAtual) <= Number(e.quantidadeMinima);
        return (
          <Card key={e.id} style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5 }}>{baixo ? "🔴 " : ""}{e.produto}</div>
              <div style={{ fontSize: 12, color: C.inkMuted }}>{e.quantidadeAtual} em estoque · mínimo {e.quantidadeMinima} {baixo ? "· Estoque baixo" : ""}</div>
            </div>
            {podeEditar && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Button variant="ghost" small onClick={() => ajustar(e.id, -1)}>−</Button>
                <Button variant="ghost" small onClick={() => ajustar(e.id, 1)}>+</Button>
                <Button variant="danger" small onClick={() => remove(e.id)}><Trash2 size={13} /></Button>
              </div>
            )}
          </Card>
        );
      })}
      {podeEditar && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 6, alignItems: "end" }}>
          <Field label="Produto"><Input value={novo.produto} onChange={e => setNovo({ ...novo, produto: e.target.value })} /></Field>
          <Field label="Qtd. atual"><Input type="number" value={novo.quantidadeAtual} onChange={e => setNovo({ ...novo, quantidadeAtual: e.target.value })} /></Field>
          <Field label="Mínima"><Input type="number" value={novo.quantidadeMinima} onChange={e => setNovo({ ...novo, quantidadeMinima: e.target.value })} /></Field>
          <Button onClick={add}><Plus size={15} /></Button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   TAREFAS (to-do interno)
--------------------------------------------------------- */
const PRIORIDADES = ["Baixa", "Média", "Alta"];
const STATUS_TAREFA = ["Pendente", "Em andamento", "Concluída"];

function Tarefas({ tarefas, persist, user }) {
  const [modal, setModal] = useState(false);
  const emptyForm = { titulo: "", responsavel: user.nome, prazo: "", prioridade: "Média", status: "Pendente" };
  const [form, setForm] = useState(emptyForm);

  const save = () => { if (!form.titulo.trim()) return; persist([...tarefas, { ...form, id: uid() }]); setForm(emptyForm); setModal(false); };
  const remove = (id) => persist(tarefas.filter(t => t.id !== id));
  const setStatus = (t, status) => persist(tarefas.map(x => x.id === t.id ? { ...x, status } : x));

  const ordenadas = [...tarefas].sort((a, b) => (a.status === "Concluída") - (b.status === "Concluída") || (a.prazo || "9999").localeCompare(b.prazo || "9999"));
  const toneP = { Baixa: "sage", Média: "brass", Alta: "brick" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <SectionTitle>Tarefas</SectionTitle>
        <Button onClick={() => { setForm(emptyForm); setModal(true); }}><Plus size={16} /> Nova tarefa</Button>
      </div>

      {tarefas.length === 0 && <Empty icon={ListChecks} text="Nenhuma tarefa cadastrada. Ex: consertar o Cadillac, renovar o alvará..." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ordenadas.map(t => (
          <Card key={t.id} style={{ padding: 14, opacity: t.status === "Concluída" ? 0.6 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14, color: C.ink, textDecoration: t.status === "Concluída" ? "line-through" : "none" }}>{t.titulo}</span>
                  <Badge tone={toneP[t.prioridade]}>{t.prioridade}</Badge>
                </div>
                <div style={{ fontSize: 12.5, color: C.inkMuted, marginTop: 4 }}>{t.responsavel} {t.prazo ? `· prazo ${fmtDate(t.prazo)}` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Select value={t.status} onChange={e => setStatus(t, e.target.value)} style={{ width: 140 }}>
                  {STATUS_TAREFA.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Button variant="danger" small onClick={() => remove(t.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {modal && (
        <Modal title="Nova tarefa" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="O que precisa ser feito?"><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Agendar manutenção do ar-condicionado" /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Responsável">
                <Select value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })}>
                  {USERS.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}
                </Select>
              </Field>
              <Field label="Prazo (opcional)"><Input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} /></Field>
            </div>
            <Field label="Prioridade"><Select value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}>{PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}</Select></Field>
            <Button onClick={save} style={{ justifyContent: "center" }}>Salvar tarefa</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   CENTRAL DE DOCUMENTOS
--------------------------------------------------------- */
const CATEGORIAS_DOC = ["Contratos", "Alvarás", "Licenças", "Termos de uso de imagem", "Modelos de recibo", "Documentos do CREFITO", "Notas fiscais de equipamentos"];
const CATEGORIAS_RESTRITAS = ["Contratos", "Alvarás", "Licenças", "Notas fiscais de equipamentos"];

function Documentos({ documentos, persist, user }) {
  const [modal, setModal] = useState(false);
  const emptyForm = { nome: "", categoria: "Contratos", link: "", restrito: true };
  const [form, setForm] = useState(emptyForm);
  const podeVerRestrito = user.nivel === "total" || user.nivel === "gerencial";

  const save = () => { if (!form.nome.trim()) return; persist([...documentos, { ...form, id: uid(), dataUpload: todayISO() }]); setForm(emptyForm); setModal(false); };
  const remove = (id) => persist(documentos.filter(d => d.id !== id));

  const visiveis = documentos.filter(d => !d.restrito || podeVerRestrito);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <SectionTitle>Central de documentos</SectionTitle>
        <Button onClick={() => { setForm(emptyForm); setModal(true); }}><Plus size={16} /> Novo documento</Button>
      </div>
      <div style={{ fontSize: 12.5, color: C.inkMuted, marginBottom: 16, fontFamily: FONT_BODY }}>
        Protótipo: guarda o registro e o link de onde o arquivo está (Drive, etc.) — upload direto de arquivo entra na versão final.
      </div>

      {visiveis.length === 0 && <Empty icon={FolderLock} text="Nenhum documento cadastrado ainda." />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visiveis.map(d => (
          <Card key={d.id} style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14 }}>{d.nome}</span>
                <Badge tone="teal">{d.categoria}</Badge>
                {d.restrito && <Badge tone="brick"><Lock size={9} style={{ verticalAlign: "middle", marginRight: 2 }} />Restrito</Badge>}
              </div>
              <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 4 }}>Adicionado em {fmtDate(d.dataUpload)}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {d.link && <a href={d.link} target="_blank" rel="noreferrer" style={{ color: C.sage, fontSize: 13, fontFamily: FONT_BODY, display: "flex", alignItems: "center", gap: 4 }}><LinkIcon size={13} /> Abrir</a>}
              {podeVerRestrito && <Button variant="danger" small onClick={() => remove(d.id)}><Trash2 size={14} /></Button>}
            </div>
          </Card>
        ))}
      </div>

      {modal && (
        <Modal title="Novo documento" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Nome do documento"><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Contrato de aluguel 2026" /></Field>
            <Field label="Categoria">
              <Select value={form.categoria} onChange={e => {
                const cat = e.target.value;
                setForm({ ...form, categoria: cat, restrito: CATEGORIAS_RESTRITAS.includes(cat) });
              }}>
                {CATEGORIAS_DOC.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Link do arquivo (Drive, Dropbox, etc.)"><Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://drive.google.com/..." /></Field>
            <Checkbox label="Documento restrito (só proprietária e administradora veem)" checked={form.restrito} onChange={() => setForm({ ...form, restrito: !form.restrito })} />
            <Button onClick={save} style={{ justifyContent: "center" }}>Salvar documento</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   RELATÓRIOS
--------------------------------------------------------- */
function Relatorios({ pacientes, agenda, evolucoes, caixa, atendimentosQuiro }) {
  const [tipo, setTipo] = useState("agendaDia");
  const [data, setData] = useState(todayISO());
  const [mes, setMes] = useState(todayISO().slice(0, 7));

  const OPCOES = [
    { v: "agendaDia", label: "Agenda diária" },
    { v: "frequencia", label: "Frequência dos pacientes" },
    { v: "evolucoes", label: "Evoluções clínicas" },
    { v: "ativos", label: "Pacientes ativos" },
    { v: "inativos", label: "Pacientes inativos" },
    { v: "inadimplentes", label: "Inadimplentes" },
    { v: "caixa", label: "Caixa (entradas e saídas)" },
    { v: "comissao", label: "Comissão quiropraxia" },
  ];

  let conteudo = null;
  if (tipo === "agendaDia") {
    const lista = agenda.filter(a => a.data === data);
    conteudo = lista.map(a => <div key={a.id} style={{ fontSize: 13.5, padding: "4px 0" }}>{a.horario} — {a.pacienteNome} ({a.tipo}) — {a.status}</div>);
  } else if (tipo === "frequencia") {
    const contagem = {};
    agenda.forEach(a => { contagem[a.pacienteNome] = (contagem[a.pacienteNome] || 0) + 1; });
    conteudo = Object.entries(contagem).sort((a, b) => b[1] - a[1]).map(([nome, n]) => <div key={nome} style={{ fontSize: 13.5, padding: "4px 0" }}>{nome} — {n} atendimento(s)</div>);
  } else if (tipo === "evolucoes") {
    conteudo = evolucoes.map(e => <div key={e.id} style={{ fontSize: 13.5, padding: "4px 0" }}>{fmtDate(e.data)} — paciente #{e.pacienteId.slice(-4)} — {e.profissionalNome}</div>);
  } else if (tipo === "ativos" || tipo === "inativos") {
    conteudo = pacientes.filter(p => p.status === (tipo === "ativos" ? "ativo" : "inativo")).map(p => <div key={p.id} style={{ fontSize: 13.5, padding: "4px 0" }}>{p.nome}</div>);
  } else if (tipo === "inadimplentes") {
    conteudo = pacientes.filter(p => p.vencimento < todayISO() && p.statusPagamento !== "pago").map(p => <div key={p.id} style={{ fontSize: 13.5, padding: "4px 0" }}>{p.nome} — vencido {fmtDate(p.vencimento)} — {fmtMoney(p.valorMensalidade)}</div>);
  } else if (tipo === "caixa") {
    const doMes = caixa.filter(c => c.data.startsWith(mes));
    conteudo = doMes.map(c => <div key={c.id} style={{ fontSize: 13.5, padding: "4px 0" }}>{fmtDate(c.data)} — {c.tipo} — {c.descricao} — {fmtMoney(c.valor)}</div>);
  } else if (tipo === "comissao") {
    const doMes = atendimentosQuiro.filter(a => a.data.startsWith(mes));
    const total = doMes.reduce((s, a) => s + a.comissaoFraciele, 0);
    conteudo = <>{doMes.map(a => <div key={a.id} style={{ fontSize: 13.5, padding: "4px 0" }}>{fmtDate(a.data)} — {a.pacienteNome} — comissão {fmtMoney(a.comissaoFraciele)}</div>)}<div style={{ marginTop: 10, fontWeight: 700 }}>Total do mês: {fmtMoney(total)}</div></>;
  }

  return (
    <div>
      <SectionTitle>Relatórios</SectionTitle>
      <div style={{ display: "flex", gap: 10, margin: "16px 0", flexWrap: "wrap" }}>
        <Select value={tipo} onChange={e => setTipo(e.target.value)} style={{ width: 220 }}>
          {OPCOES.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
        </Select>
        {tipo === "agendaDia" && <Input type="date" value={data} onChange={e => setData(e.target.value)} style={{ width: 160 }} />}
        {(tipo === "caixa" || tipo === "comissao") && <Input type="month" value={mes} onChange={e => setMes(e.target.value)} style={{ width: 160 }} />}
        <Button variant="ghost" onClick={() => window.print()}><Printer size={15} /> Imprimir / PDF</Button>
      </div>
      <Card>
        {(!conteudo || (Array.isArray(conteudo) && conteudo.length === 0)) ? <Empty icon={FileText} text="Sem dados para esse filtro." /> : conteudo}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------
   APP PRINCIPAL
--------------------------------------------------------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("painel");

  const pacientesC = useCollection("clinica:pacientes");
  const agendaC = useCollection("clinica:agenda");
  const evolucoesC = useCollection("clinica:evolucoes");
  const anamnesesC = useCollection("clinica:anamneses");
  const caixaC = useCollection("clinica:caixa");
  const quiroC = useCollection("clinica:quiropraxia");
  const mensagensC = useCollection("clinica:mensagens");
  const capacidadeC = useCollection("clinica:capacidade");
  const comprasC = useCollection("clinica:compras");
  const estoqueC = useCollection("clinica:estoque");
  const tarefasC = useCollection("clinica:tarefas");
  const documentosC = useCollection("clinica:documentos");

  const allLoaded = [pacientesC, agendaC, evolucoesC, anamnesesC, caixaC, quiroC, mensagensC, capacidadeC, comprasC, estoqueC, tarefasC, documentosC].every(c => c.loaded);
  const capacidade = (capacidadeC.items && capacidadeC.items.pilates) ? capacidadeC.items : { pilates: 6, fisioterapia: 3 };
  const persistCapacidade = (v) => capacidadeC.persist(v);

  if (!user) return <LoginScreen onSelect={setUser} />;

  const NAV_ALL = [
    { key: "painel", label: "Painel", icon: Home, niveis: ["total", "gerencial", "fisio", "restrito"] },
    { key: "agenda", label: "Agenda", icon: Calendar, niveis: ["total", "gerencial", "fisio", "restrito"] },
    { key: "pacientes", label: "Pacientes", icon: Users, niveis: ["total", "gerencial", "fisio"] },
    { key: "financeiro", label: "Financeiro", icon: Wallet, niveis: ["total", "gerencial", "fisio"] },
    { key: "quiropraxia", label: "Quiropraxia", icon: Stethoscope, niveis: ["total", "restrito"] },
    { key: "compras", label: "Compras", icon: ShoppingCart, niveis: ["total", "gerencial", "fisio", "restrito"] },
    { key: "tarefas", label: "Tarefas", icon: ListChecks, niveis: ["total", "gerencial", "fisio", "restrito"] },
    { key: "documentos", label: "Documentos", icon: FolderLock, niveis: ["total", "gerencial", "fisio", "restrito"] },
    { key: "comunicacao", label: "Comunicação", icon: MessageCircle, niveis: ["total", "gerencial", "fisio"] },
    { key: "relatorios", label: "Relatórios", icon: FileText, niveis: ["total", "gerencial", "fisio"] },
  ];
  const NAV = NAV_ALL.filter(n => n.niveis.includes(user.nivel));

  const dataError = [pacientesC, agendaC, evolucoesC, anamnesesC, caixaC, quiroC, mensagensC].map(c => c.error).find(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT_BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: ${C.sage} !important; }
        @media (max-width: 760px) { .dash-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "16px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, margin: 0, color: C.ink, letterSpacing: 0.3 }}>DANIELLA ROMANY</h1>
            <div style={{ fontSize: 12, color: C.inkMuted }}>{user.nome} · {user.papel}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 13, color: C.inkMuted, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} />{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </div>
            <button onClick={() => setUser(null)} style={{ background: "none", border: "none", color: C.inkMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <LogOut size={14} /> Trocar perfil
            </button>
          </div>
        </div>
      </header>

      <nav style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 10, overflowX: "auto" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 4, padding: "0 20px" }}>
          {NAV.map(n => (
            <button key={n.key} onClick={() => setTab(n.key)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "13px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: tab === n.key ? C.sage : C.inkMuted, borderBottom: tab === n.key ? `2px solid ${C.sage}` : "2px solid transparent", whiteSpace: "nowrap" }}>
              <n.icon size={15} />{n.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 60px" }}>
        {dataError && <div style={{ background: C.brickSoft, color: C.brick, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{dataError}</div>}
        {!allLoaded ? <Loading /> : (
          <>
            {tab === "painel" && <Painel pacientes={pacientesC.items} agenda={agendaC.items} evolucoes={evolucoesC.items} compras={comprasC.items} user={user} setTab={setTab} />}
            {tab === "agenda" && <Agenda agenda={agendaC.items} persist={agendaC.persist} pacientes={pacientesC.items} capacidade={capacidade} persistCapacidade={persistCapacidade} user={user} />}
            {tab === "pacientes" && (NAV.find(n => n.key === "pacientes")) && (
              <Pacientes
                pacientes={pacientesC.items} persist={pacientesC.persist}
                evolucoes={evolucoesC.items} persistEvolucoes={evolucoesC.persist}
                anamneses={anamnesesC.items} persistAnamneses={anamnesesC.persist}
                user={user}
              />
            )}
            {tab === "financeiro" && (NAV.find(n => n.key === "financeiro")) && <Financeiro pacientes={pacientesC.items} persistPacientes={pacientesC.persist} caixa={caixaC.items} persistCaixa={caixaC.persist} user={user} />}
            {tab === "quiropraxia" && (NAV.find(n => n.key === "quiropraxia")) && <Quiropraxia atendimentos={quiroC.items} persist={quiroC.persist} pacientes={pacientesC.items} user={user} />}
            {tab === "compras" && (NAV.find(n => n.key === "compras")) && (
              <Compras compras={comprasC.items} persist={comprasC.persist} estoque={estoqueC.items} persistEstoque={estoqueC.persist} caixa={caixaC.items} persistCaixa={caixaC.persist} user={user} />
            )}
            {tab === "tarefas" && (NAV.find(n => n.key === "tarefas")) && <Tarefas tarefas={tarefasC.items} persist={tarefasC.persist} user={user} />}
            {tab === "documentos" && (NAV.find(n => n.key === "documentos")) && <Documentos documentos={documentosC.items} persist={documentosC.persist} user={user} />}
            {tab === "comunicacao" && (NAV.find(n => n.key === "comunicacao")) && <Comunicacao agenda={agendaC.items} pacientes={pacientesC.items} mensagens={mensagensC.items} persist={mensagensC.persist} />}
            {tab === "relatorios" && (NAV.find(n => n.key === "relatorios")) && <Relatorios pacientes={pacientesC.items} agenda={agendaC.items} evolucoes={evolucoesC.items} caixa={caixaC.items} atendimentosQuiro={quiroC.items} />}
          </>
        )}
      </main>
    </div>
  );
}
