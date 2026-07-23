"use client";

import { useState, useTransition } from "react";
import { Button, CheckGroup, Checkbox, Field, Input, Select, TextArea } from "@/components/ui";
import { todayISO } from "@/lib/format";
import {
  ACESSORIOS,
  ALONGAMENTOS,
  APARELHOS,
  AQUECIMENTO,
  CADEIAS,
  FORTALECIMENTO_GRUPOS,
  MM,
  MOBILIDADE,
  OUTROS_TREINOS,
  REGIOES,
  RELAXAMENTO,
  REPS,
} from "@/lib/evolucao-constants";
import type { BlocoSintoma, FortalecimentoItem } from "@/lib/supabase/database.types";
import { salvarEvolucao, type EvolucaoFormInput } from "@/app/(app)/pacientes/[id]/actions";

function toggleArr(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

const emptySintoma = (): BlocoSintoma => ({ marcado: false, regioes: [], dorIrradiada: false, dorTipos: [], outros: "" });

function BlocoSintomaField({
  titulo,
  valor,
  onChange,
  comHigidez,
  comEncurtamento,
  comIntercorrencia,
}: {
  titulo: string;
  valor: BlocoSintoma;
  onChange: (v: BlocoSintoma) => void;
  comHigidez?: boolean;
  comEncurtamento?: boolean;
  comIntercorrencia?: boolean;
}) {
  const set = (patch: Partial<BlocoSintoma>) => onChange({ ...valor, ...patch });
  return (
    <div>
      <div className="text-[12.5px] font-bold text-ink-muted mb-1">{titulo}</div>
      {comIntercorrencia && (
        <Checkbox label="Sem intercorrências" checked={!!valor.semIntercorrencias} onChange={() => set({ semIntercorrencias: !valor.semIntercorrencias })} />
      )}
      {comHigidez && <Checkbox label="Hígido" checked={!!valor.higido} onChange={() => set({ higido: !valor.higido })} />}

      <Checkbox label="Quadro álgico" checked={valor.marcado} onChange={() => set({ marcado: !valor.marcado })} />
      {valor.marcado && (
        <div className="ml-[22px] mb-1">
          <CheckGroup options={REGIOES} values={valor.regioes} onToggle={(v) => set({ regioes: toggleArr(valor.regioes, v) })} columns={3} />
        </div>
      )}

      <Checkbox label="Dor irradiada" checked={valor.dorIrradiada} onChange={() => set({ dorIrradiada: !valor.dorIrradiada })} />
      {valor.dorIrradiada && (
        <div className="ml-[22px] mb-1">
          <CheckGroup options={MM} values={valor.dorTipos} onToggle={(v) => set({ dorTipos: toggleArr(valor.dorTipos, v) })} columns={2} />
        </div>
      )}

      {comEncurtamento && (
        <>
          <Checkbox label="Encurtamento muscular" checked={!!valor.encurtamento} onChange={() => set({ encurtamento: !valor.encurtamento })} />
          {valor.encurtamento && (
            <div className="ml-[22px] mb-1">
              <CheckGroup
                options={CADEIAS}
                values={valor.cadeias || []}
                onToggle={(v) => set({ cadeias: toggleArr(valor.cadeias || [], v) })}
                columns={2}
              />
            </div>
          )}
        </>
      )}
      {comIntercorrencia && (
        <>
          <Checkbox label="Tontura" checked={!!valor.tontura} onChange={() => set({ tontura: !valor.tontura })} />
          <div className="flex gap-4">
            <Checkbox label="Elevação da P.A." checked={!!valor.elevacaoPA} onChange={() => set({ elevacaoPA: !valor.elevacaoPA })} />
            <Checkbox label="Redução da P.A." checked={!!valor.reducaoPA} onChange={() => set({ reducaoPA: !valor.reducaoPA })} />
          </div>
        </>
      )}
      <Input placeholder="Outros" value={valor.outros} onChange={(e) => set({ outros: e.target.value })} className="mt-1" />
    </div>
  );
}

function BlocoComOutros({
  titulo,
  options,
  values,
  onToggle,
  outros,
  onOutros,
  columns = 2,
}: {
  titulo: string;
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
  outros: string;
  onOutros: (v: string) => void;
  columns?: number;
}) {
  return (
    <div>
      <div className="text-[12.5px] font-bold text-ink-muted mb-1">{titulo}</div>
      <CheckGroup options={options} values={values} onToggle={onToggle} columns={columns} />
      <Input placeholder="Outros" value={outros} onChange={(e) => onOutros(e.target.value)} className="mt-1.5" />
    </div>
  );
}

export function EvolucaoForm({
  pacienteId,
  onSaved,
  onCancel,
}: {
  pacienteId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EvolucaoFormInput>({
    data: todayISO(),
    sinais_vitais: { aferido: "nao", pa: "", fc: "" },
    pre: { ...emptySintoma(), higido: false, encurtamento: false, cadeias: [] },
    intercorrencias: { ...emptySintoma(), semIntercorrencias: false, tontura: false, elevacaoPA: false, reducaoPA: false },
    pos: { ...emptySintoma(), higido: false },
    aparelhos: [],
    acessorios: [],
    acessorios_outros: "",
    aquecimento: [],
    aquecimento_outros: "",
    mobilidade: [],
    mobilidade_outros: "",
    alongamentos: [],
    alongamentos_outros: "",
    fortalecimento: {},
    fortalecimento_outros: "",
    relaxamento: [],
    relaxamento_outros: "",
    outros_treinos: [],
    observacoes: "",
  });

  const toggleIn = (key: "aparelhos" | "acessorios" | "aquecimento" | "mobilidade" | "alongamentos" | "relaxamento" | "outros_treinos", val: string) =>
    setForm((f) => ({ ...f, [key]: toggleArr(f[key], val) }));

  const toggleForte = (grupo: string, rep: string) =>
    setForm((f) => {
      const atual: FortalecimentoItem = f.fortalecimento[grupo] || { marcado: true, reps: [] };
      return { ...f, fortalecimento: { ...f.fortalecimento, [grupo]: { marcado: true, reps: toggleArr(atual.reps || [], rep) } } };
    });
  const desmarcarForte = (grupo: string) =>
    setForm((f) => ({ ...f, fortalecimento: { ...f.fortalecimento, [grupo]: { marcado: false, reps: [] } } }));

  const salvar = () => {
    startTransition(async () => {
      const res = await salvarEvolucao(pacienteId, form);
      if (res.error) {
        setError(res.error);
        return;
      }
      onSaved();
    });
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data do atendimento">
          <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
        </Field>
        <Field label="Aferição de sinais vitais">
          <Select
            value={form.sinais_vitais.aferido}
            onChange={(e) => setForm({ ...form, sinais_vitais: { ...form.sinais_vitais, aferido: e.target.value as "sim" | "nao" } })}
          >
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </Select>
        </Field>
      </div>
      {form.sinais_vitais.aferido === "sim" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="P.A. (mmHg)">
            <Input
              value={form.sinais_vitais.pa}
              onChange={(e) => setForm({ ...form, sinais_vitais: { ...form.sinais_vitais, pa: e.target.value } })}
              placeholder="Ex: 120/80"
            />
          </Field>
          <Field label="F.C. (bpm)">
            <Input
              value={form.sinais_vitais.fc}
              onChange={(e) => setForm({ ...form, sinais_vitais: { ...form.sinais_vitais, fc: e.target.value } })}
            />
          </Field>
        </div>
      )}

      <BlocoSintomaField titulo="Pré-atendimento" valor={form.pre} onChange={(v) => setForm({ ...form, pre: v })} comHigidez comEncurtamento />
      <BlocoSintomaField titulo="Intercorrências" valor={form.intercorrencias} onChange={(v) => setForm({ ...form, intercorrencias: v })} comIntercorrencia />
      <BlocoSintomaField titulo="Pós-atendimento" valor={form.pos} onChange={(v) => setForm({ ...form, pos: v })} comHigidez />

      <div>
        <div className="text-[12.5px] font-bold text-ink-muted mb-1">Aparelhos utilizados</div>
        <CheckGroup options={APARELHOS} values={form.aparelhos} onToggle={(v) => toggleIn("aparelhos", v)} columns={2} />
      </div>
      <BlocoComOutros
        titulo="Acessórios utilizados"
        options={ACESSORIOS}
        values={form.acessorios}
        onToggle={(v) => toggleIn("acessorios", v)}
        outros={form.acessorios_outros}
        onOutros={(v) => setForm({ ...form, acessorios_outros: v })}
      />
      <BlocoComOutros
        titulo="Aquecimento / Pré-pilates"
        options={AQUECIMENTO}
        values={form.aquecimento}
        onToggle={(v) => toggleIn("aquecimento", v)}
        outros={form.aquecimento_outros}
        onOutros={(v) => setForm({ ...form, aquecimento_outros: v })}
      />
      <BlocoComOutros
        titulo="Mobilidade"
        options={MOBILIDADE}
        values={form.mobilidade}
        onToggle={(v) => toggleIn("mobilidade", v)}
        outros={form.mobilidade_outros}
        onOutros={(v) => setForm({ ...form, mobilidade_outros: v })}
      />
      <BlocoComOutros
        titulo="Alongamentos"
        options={ALONGAMENTOS}
        values={form.alongamentos}
        onToggle={(v) => toggleIn("alongamentos", v)}
        outros={form.alongamentos_outros}
        onOutros={(v) => setForm({ ...form, alongamentos_outros: v })}
      />

      <div>
        <div className="text-[12.5px] font-bold text-ink-muted mb-1">Fortalecimento</div>
        <div className="flex flex-col gap-0.5">
          {FORTALECIMENTO_GRUPOS.map((g) => {
            const st = form.fortalecimento[g] || { marcado: false, reps: [] };
            return (
              <div key={g} className="flex items-center gap-2.5 flex-wrap py-0.5">
                <label className="flex items-center gap-2 text-[13.5px] min-w-[160px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={st.marcado}
                    onChange={() =>
                      st.marcado
                        ? desmarcarForte(g)
                        : setForm((f) => ({ ...f, fortalecimento: { ...f.fortalecimento, [g]: { marcado: true, reps: [] } } }))
                    }
                    className="w-4 h-4 accent-sage"
                  />
                  {g}
                </label>
                {st.marcado && (
                  <div className="flex gap-1.5">
                    {REPS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleForte(g, r)}
                        className={`rounded-md px-2 py-0.5 text-xs border ${
                          st.reps.includes(r) ? "border-sage bg-sage-soft text-sage" : "border-border text-ink-muted"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Input
          placeholder="Outros"
          value={form.fortalecimento_outros}
          onChange={(e) => setForm({ ...form, fortalecimento_outros: e.target.value })}
          className="mt-1.5"
        />
      </div>

      <BlocoComOutros
        titulo="Relaxamento"
        options={RELAXAMENTO}
        values={form.relaxamento}
        onToggle={(v) => toggleIn("relaxamento", v)}
        outros={form.relaxamento_outros}
        onOutros={(v) => setForm({ ...form, relaxamento_outros: v })}
      />

      <div>
        <div className="text-[12.5px] font-bold text-ink-muted mb-1">Outros treinos / atividades complementares</div>
        <CheckGroup options={OUTROS_TREINOS} values={form.outros_treinos} onToggle={(v) => toggleIn("outros_treinos", v)} columns={2} />
      </div>

      <Field label="Observações">
        <TextArea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
      </Field>

      {error && <div className="bg-brick-soft text-brick text-[12.5px] rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-2 sticky bottom-0 bg-surface pt-2.5">
        <Button onClick={salvar} disabled={pending} className="flex-1 justify-center">
          Salvar evolução
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
