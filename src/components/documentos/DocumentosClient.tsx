"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderLock, Link as LinkIcon, Lock, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, Checkbox, Empty, Field, Input, Modal, Select, SectionTitle } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { podeVerDocRestrito } from "@/lib/nav";
import { CATEGORIAS_DOC, CATEGORIAS_RESTRITAS } from "@/lib/documentos-constants";
import type { AppRole, CategoriaDocumento, Documento } from "@/lib/supabase/database.types";
import { deleteDocumento, getDocumentoUrl, uploadDocumento } from "@/app/(app)/documentos/actions";

export function DocumentosClient({ documentos, role }: { documentos: Documento[]; role: AppRole }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState(false);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<CategoriaDocumento>("Contratos");
  const [restrito, setRestrito] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const podeVerRestrito = podeVerDocRestrito(role);

  const abrir = (id: string) => {
    startTransition(async () => {
      const res = await getDocumentoUrl(id);
      if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
      else setError(res.error);
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteDocumento(id);
      router.refresh();
    });
  };

  const salvar = () => {
    if (!nome.trim() || !fileRef.current?.files?.[0]) {
      setError("Informe o nome e selecione um arquivo.");
      return;
    }
    const fd = new FormData();
    fd.append("nome", nome);
    fd.append("categoria", categoria);
    fd.append("restrito", String(restrito));
    fd.append("file", fileRef.current.files[0]);

    startTransition(async () => {
      const res = await uploadDocumento(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setNome("");
      setCategoria("Contratos");
      setRestrito(true);
      setModal(false);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-[18px]">
        <SectionTitle>Central de documentos</SectionTitle>
        <Button onClick={() => { setError(null); setModal(true); }}>
          <Plus size={16} /> Novo documento
        </Button>
      </div>

      {documentos.length === 0 && <Empty icon={FolderLock} text="Nenhum documento cadastrado ainda." />}

      <div className="flex flex-col gap-2">
        {documentos.map((d) => (
          <Card key={d.id} className="!p-3.5 flex justify-between items-center flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{d.nome}</span>
                <Badge tone="teal">{d.categoria}</Badge>
                {d.restrito && (
                  <Badge tone="brick">
                    <Lock size={9} className="inline align-middle mr-0.5" />
                    Restrito
                  </Badge>
                )}
              </div>
              <div className="text-xs text-ink-muted mt-1">Adicionado em {fmtDate(d.data_upload)}</div>
            </div>
            <div className="flex gap-2.5 items-center">
              <button
                onClick={() => abrir(d.id)}
                disabled={pending}
                className="text-sage text-[13px] flex items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <LinkIcon size={13} /> Abrir
              </button>
              {podeVerRestrito && (
                <Button variant="danger" small onClick={() => remove(d.id)} disabled={pending}>
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {modal && (
        <Modal title="Novo documento" onClose={() => setModal(false)}>
          <div className="flex flex-col gap-3.5">
            <Field label="Nome do documento">
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Contrato de aluguel 2026" />
            </Field>
            <Field label="Categoria">
              <Select
                value={categoria}
                onChange={(e) => {
                  const cat = e.target.value as CategoriaDocumento;
                  setCategoria(cat);
                  setRestrito(CATEGORIAS_RESTRITAS.includes(cat));
                }}
              >
                {CATEGORIAS_DOC.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Arquivo (PDF ou imagem)">
              <input ref={fileRef} type="file" accept=".pdf,image/*" className="text-sm" />
            </Field>
            <Checkbox
              label="Documento restrito (só proprietária e administradora veem)"
              checked={restrito}
              onChange={() => setRestrito(!restrito)}
            />
            {error && <div className="bg-brick-soft text-brick text-[12.5px] rounded-lg px-3 py-2">{error}</div>}
            <Button onClick={salvar} disabled={pending} className="justify-center">
              Salvar documento
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
