export const todayISO = () => new Date().toISOString().slice(0, 10);

export const fmtMoney = (n: number | null | undefined) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const idade = (nasc: string | null | undefined) => {
  if (!nasc) return "—";
  const b = new Date(nasc);
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
