"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayISO } from "@/lib/format";
import type { CategoriaDocumento } from "@/lib/supabase/database.types";

const BUCKET = "documentos";

export async function uploadDocumento(formData: FormData) {
  const profile = await requireProfile();

  const nome = String(formData.get("nome") || "").trim();
  const categoria = String(formData.get("categoria") || "") as CategoriaDocumento;
  const restrito = formData.get("restrito") === "true";
  const file = formData.get("file");

  if (!nome) return { error: "Informe o nome do documento." };
  if (!(file instanceof File) || file.size === 0) return { error: "Selecione um arquivo." };

  const supabase = await createClient();
  const path = `${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("documentos").insert({
    nome,
    categoria,
    storage_path: path,
    restrito,
    data_upload: todayISO(),
    uploaded_by: profile.id,
  });

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: insertError.message };
  }

  revalidatePath("/documentos");
  return { error: null };
}

export async function getDocumentoUrl(id: string): Promise<{ url: string | null; error: string | null }> {
  await requireProfile();
  const supabase = await createClient();

  const { data: doc } = await supabase.from("documentos").select("storage_path").eq("id", id).maybeSingle();
  if (!doc) return { url: null, error: "Documento não encontrado ou sem permissão de acesso." };

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60);
  if (error || !data) return { url: null, error: error?.message ?? "Não foi possível gerar o link." };

  return { url: data.signedUrl, error: null };
}

export async function deleteDocumento(id: string) {
  await requireProfile();
  const supabase = await createClient();

  const { data: doc } = await supabase.from("documentos").select("storage_path").eq("id", id).maybeSingle();
  await supabase.from("documentos").delete().eq("id", id);
  if (doc) await supabase.storage.from(BUCKET).remove([doc.storage_path]);

  revalidatePath("/documentos");
}
