"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Field, Input, Modal } from "@/components/ui";
import type { EstoqueItem } from "@/lib/supabase/database.types";
import { addEstoque, ajustarEstoque, removeEstoque, type EstoqueFormInput } from "@/app/(app)/compras/actions";

const emptyForm: EstoqueFormInput = { produto: "", quantidade_atual: 0, quantidade_minima: 0 };

export function EstoqueModal({ estoque, podeEditar, onClose }: { estoque: EstoqueItem[]; podeEditar: boolean; onClose: () => void }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [novo, setNovo] = useState<EstoqueFormInput>(emptyForm);

  const add = () => {
    if (!novo.produto.trim()) return;
    startTransition(async () => {
      await addEstoque(novo);
      setNovo(emptyForm);
      router.refresh();
    });
  };

  const ajustar = (id: string, delta: number) => {
    startTransition(async () => {
      await ajustarEstoque(id, delta);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await removeEstoque(id);
      router.refresh();
    });
  };

  return (
    <Modal title="Controle de estoque" onClose={onClose} width={480}>
      <div className="flex flex-col gap-3">
        <div className="text-xs text-ink-muted">
          Opcional: acompanhe o essencial (álcool, papel toalha, faixas...) e receba aviso quando estiver baixo.
        </div>
        {estoque.map((e) => {
          const baixo = Number(e.quantidade_atual) <= Number(e.quantidade_minima);
          return (
            <div key={e.id} className="bg-surface border border-border rounded-xl p-3 flex justify-between items-center">
              <div>
                <div className="font-semibold text-[13.5px]">
                  {baixo ? "🔴 " : ""}
                  {e.produto}
                </div>
                <div className="text-xs text-ink-muted">
                  {e.quantidade_atual} em estoque · mínimo {e.quantidade_minima} {baixo ? "· Estoque baixo" : ""}
                </div>
              </div>
              {podeEditar && (
                <div className="flex gap-1.5 items-center">
                  <Button variant="ghost" small onClick={() => ajustar(e.id, -1)}>
                    −
                  </Button>
                  <Button variant="ghost" small onClick={() => ajustar(e.id, 1)}>
                    +
                  </Button>
                  <Button variant="danger" small onClick={() => remove(e.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {podeEditar && (
          <div className="grid gap-1.5 items-end" style={{ gridTemplateColumns: "2fr 1fr 1fr auto" }}>
            <Field label="Produto">
              <Input value={novo.produto} onChange={(e) => setNovo({ ...novo, produto: e.target.value })} />
            </Field>
            <Field label="Qtd. atual">
              <Input type="number" value={novo.quantidade_atual} onChange={(e) => setNovo({ ...novo, quantidade_atual: Number(e.target.value) })} />
            </Field>
            <Field label="Mínima">
              <Input type="number" value={novo.quantidade_minima} onChange={(e) => setNovo({ ...novo, quantidade_minima: Number(e.target.value) })} />
            </Field>
            <Button onClick={add}>
              <Plus size={15} />
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
